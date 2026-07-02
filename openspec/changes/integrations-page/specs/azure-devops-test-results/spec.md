## MODIFIED Requirements

### Requirement: Azure DevOps is configured from the integrations page
Azure DevOps configuration SHALL be accessible from `/dashboard/integrations` rather than from the dashboard setup flow.

#### Scenario: Configure button on integrations page opens Azure DevOps form
- **WHEN** a user navigates to `/dashboard/integrations` and clicks "Configure" on the Azure DevOps card
- **THEN** the Azure DevOps configuration form (organization, project, PAT, pipeline, category mapping) SHALL be displayed inline or in a modal on the integrations page

#### Scenario: Dashboard setup flow redirects to integrations for Azure DevOps config
- **WHEN** the Azure DevOps configuration entry point in the old setup flow is accessed
- **THEN** the user SHALL be directed to `/dashboard/integrations` instead
