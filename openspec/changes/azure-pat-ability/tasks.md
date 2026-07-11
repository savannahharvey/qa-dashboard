## 1. Database

- [x] 1.1 Add a new migration folder (e.g. `db/migrations/<timestamp>_add_metric_source_pat`) with `ALTER TABLE "MetricSourceConfig" ADD COLUMN "encryptedPat" TEXT;`
- [x] 1.2 Apply the migration locally and confirm `MetricSourceConfig` has the new nullable column with no data loss

## 2. Encryption helper

- [x] 2.1 Add `src/services/patEncryption.ts` (or similar) exporting `encryptPat(plaintext: string): string` and `decryptPat(stored: string): string` using AES-256-GCM via Node's `crypto` module
- [x] 2.2 Read the key from a new `ENCRYPTION_KEY` env var (32-byte, hex-encoded); throw a clear startup/usage error if it's missing or the wrong length
- [x] 2.3 Encode the stored value as a single delimited string (iv, auth tag, ciphertext, each base64) so it fits in one `TEXT` column
- [x] 2.4 Add unit tests: encrypt/decrypt round-trip, tampered ciphertext is rejected, wrong-length key is rejected

## 3. Repository layer

- [x] 3.1 Extend `MetricSourceConfig` type in `src/db/repository.ts` with `encryptedPat: string | null`
- [x] 3.2 Update `findMetricSourceConfig` to select the new column
- [x] 3.3 Add/extend an upsert method to persist `encryptedPat` (set, replace, or clear to `null`) alongside existing `settings`/`enabled` writes

## 4. API routes (`src/routes/teamRoutes.ts`)

- [x] 4.1 Remove the blanket rejection of `pat`/`token`/`AZURE_DEVOPS_PAT`/`personalAccessToken` keys in `POST /:teamId/metrics/config`
- [x] 4.2 Accept an optional top-level `pat` field on that endpoint, separate from `settings`; encrypt it via `encryptPat` before persisting; an empty string clears the stored token
- [x] 4.3 Update `GET /:teamId/metrics/config` to return `hasPat: boolean` derived from whether `encryptedPat` is set, and ensure no token material is ever included in the response

## 5. Azure sync service (`src/services/azureMetricsService.ts`)

- [x] 5.1 In `refreshAzureMetrics` and `listAzurePipelines`, resolve the token by decrypting `config.encryptedPat` when present
- [x] 5.2 Fall back to the existing `getEnv(tokenEnv ?? "AZURE_DEVOPS_PAT")` behavior when no team PAT is stored
- [x] 5.3 On decrypt failure (e.g. key mismatch), treat it the same as a missing token and emit the existing "configuration is missing" diagnostic rather than throwing

## 6. Frontend (`src/client/api.ts`, `src/client/pages/IntegrationsPage.tsx`)

- [x] 6.1 Add `pat` to the save-config request type in `src/client/api.ts`, and `hasPat` to the config response type
- [x] 6.2 Add a PAT input field to the Azure DevOps card: masked "PAT saved" state with a "Replace" action when `hasPat` is true, plain input when false
- [x] 6.3 Add a "Clear PAT" action that submits an empty `pat` value
- [x] 6.4 Render `diagnostics` messages from `getAzurePipelines`/`refreshMetrics`/`getMetricSourceConfig` responses in the Azure DevOps card instead of only generic pipeline-count messages

## 7. Configuration & docs

- [x] 7.1 Add `ENCRYPTION_KEY` to `.env.example` with a comment on how to generate one (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] 7.2 Add `ENCRYPTION_KEY` to the Render service env vars for `qa-dashboard-api` (manual step, `sync: false` like `DATABASE_URL`) — **requires Render dashboard access, not done**

## 8. Tests

- [x] 8.1 Add/extend `IntegrationsPage.test.tsx` covering: entering a PAT, masked "saved" state after save, clearing a PAT, diagnostics message rendering
- [x] 8.2 Add route tests for `POST /:teamId/metrics/config` covering PAT set/replace/clear and confirming `GET` never returns token material
- [x] 8.3 Add a test confirming `refreshAzureMetrics`/`listAzurePipelines` prefer a stored team PAT over the env var, and fall back correctly when absent
