// @vitest-environment jsdom

import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getAzurePipelines, getMetricSourceConfig, refreshMetrics, saveMetricSourceConfig } from "../api";
import { IntegrationsPage } from "./IntegrationsPage";

vi.mock("../state/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");
  return {
    ...actual,
    getAzurePipelines: vi.fn(),
    getMetricSourceConfig: vi.fn(),
    saveMetricSourceConfig: vi.fn(),
    refreshMetrics: vi.fn(),
  };
});

import { useAuth } from "../state/AuthContext";

const useAuthMock = vi.mocked(useAuth);

afterEach(() => {
  vi.clearAllMocks();
});

function authWithTeam() {
  return {
    status: "authenticated" as const,
    user: { id: "user-sam", username: "sam", displayName: "Sam" },
    teams: [{ id: "team-qa", name: "QA Dashboard Team" }],
    primaryTeam: { id: "team-qa", name: "QA Dashboard Team" },
    reloadSession: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  };
}

describe("IntegrationsPage", () => {
  it("loads and saves Azure DevOps settings", async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue(authWithTeam());
    vi.mocked(getMetricSourceConfig).mockResolvedValue({ config: null });
    vi.mocked(getAzurePipelines).mockResolvedValue({ pipelines: [], diagnostics: [] });
    vi.mocked(saveMetricSourceConfig).mockResolvedValue({ ok: true });

    render(
      <MemoryRouter initialEntries={["/dashboard/integrations"]}>
        <IntegrationsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Azure DevOps")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Enable Azure DevOps metrics"));
    await user.click(screen.getByRole("button", { name: "Save Azure settings" }));

    expect(saveMetricSourceConfig).toHaveBeenCalledWith(
      "team-qa",
      expect.objectContaining({ source: "AZURE_DEVOPS", enabled: true }),
    );
    expect(await screen.findByText("Azure DevOps settings saved.")).toBeInTheDocument();
  });

  it("saves a PAT and shows a masked saved state afterward", async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue(authWithTeam());
    vi.mocked(getMetricSourceConfig)
      .mockResolvedValueOnce({ config: null })
      .mockResolvedValueOnce({
        config: {
          source: "AZURE_DEVOPS",
          enabled: true,
          settings: {},
          hasPat: true,
        },
      });
    vi.mocked(getAzurePipelines).mockResolvedValue({ pipelines: [], diagnostics: [] });
    vi.mocked(saveMetricSourceConfig).mockResolvedValue({ ok: true });

    render(
      <MemoryRouter initialEntries={["/dashboard/integrations"]}>
        <IntegrationsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Azure DevOps")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Enable Azure DevOps metrics"));
    await user.type(screen.getByPlaceholderText("Paste an Azure DevOps PAT"), "my-pat-value");
    await user.click(screen.getByRole("button", { name: "Save Azure settings" }));

    expect(saveMetricSourceConfig).toHaveBeenCalledWith(
      "team-qa",
      expect.objectContaining({ pat: "my-pat-value" }),
    );
    expect(await screen.findByText("PAT saved")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Replace" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
  });

  it("clears a stored PAT", async () => {
    const user = userEvent.setup();
    useAuthMock.mockReturnValue(authWithTeam());
    vi.mocked(getMetricSourceConfig).mockResolvedValue({
      config: {
        source: "AZURE_DEVOPS",
        enabled: true,
        settings: {},
        hasPat: true,
      },
    });
    vi.mocked(getAzurePipelines).mockResolvedValue({ pipelines: [], diagnostics: [] });
    vi.mocked(saveMetricSourceConfig).mockResolvedValue({ ok: true });

    render(
      <MemoryRouter initialEntries={["/dashboard/integrations"]}>
        <IntegrationsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("PAT saved")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(saveMetricSourceConfig).toHaveBeenCalledWith("team-qa", expect.objectContaining({ pat: "" }));
    expect(await screen.findByText("Azure DevOps PAT cleared.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Paste an Azure DevOps PAT")).toBeInTheDocument();
  });

  it("shows a backend diagnostic instead of a generic empty state when pipelines fail to load", async () => {
    useAuthMock.mockReturnValue(authWithTeam());
    vi.mocked(getMetricSourceConfig).mockResolvedValue({
      config: {
        source: "AZURE_DEVOPS",
        enabled: true,
        settings: {},
        hasPat: false,
      },
    });
    vi.mocked(getAzurePipelines).mockResolvedValue({
      pipelines: [],
      diagnostics: [{ source: "azure-devops", message: "Azure DevOps organization, project, or token configuration is missing." }],
    });

    render(
      <MemoryRouter initialEntries={["/dashboard/integrations"]}>
        <IntegrationsPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Azure DevOps organization, project, or token configuration is missing."),
    ).toBeInTheDocument();
    expect(screen.queryByText("No pipelines were found.")).not.toBeInTheDocument();
  });

  it("renders GitHub connect as inert and Jenkins/Jira as coming soon", async () => {
    useAuthMock.mockReturnValue(authWithTeam());
    vi.mocked(getMetricSourceConfig).mockResolvedValue({ config: null });
    vi.mocked(getAzurePipelines).mockResolvedValue({ pipelines: [], diagnostics: [] });

    render(
      <MemoryRouter initialEntries={["/dashboard/integrations"]}>
        <IntegrationsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("GitHub")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect repository" })).toBeDisabled();
    expect(screen.getByText("Jenkins")).toBeInTheDocument();
    expect(screen.getByText("Jira")).toBeInTheDocument();
    expect(screen.getAllByText("Coming soon")).toHaveLength(2);
  });
});
