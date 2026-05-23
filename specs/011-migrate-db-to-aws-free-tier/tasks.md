# Migration tasks

This file breaks the spec into actionable tasks with acceptance criteria.

- Task: Validate current DB and Prisma setup
  - Inspect `prisma/migrations` and confirm schema matches runtime SQLite database.
  - Acceptance: list of migrations and current SQLite file path.

- Task: Provision RDS (Postgres) on AWS Free Tier
  - Create RDS instance, subnet group, security group.
  - Acceptance: RDS endpoint reachable from a bastion or app host.

- Task: Update Prisma schema and secrets
  - Change `schema.prisma` datasource to `postgresql` and add sample `DATABASE_URL` to env template.
  - Acceptance: `npx prisma migrate deploy` completes against RDS test DB.

- Task: Provision and store DB credentials in Secrets Manager (Terraform)
  - Use Terraform in `infra/terraform` to create infra. If `db_password` is not provided, Terraform will generate a password and store it in Secrets Manager.
  - Acceptance: `terraform apply` completed and `secrets_arn` output is present; credentials retrievable via `aws secretsmanager get-secret-value`.

- Task: Create and attach least-privileged IAM role for app access
  - Terraform creates an IAM policy and role (`qa-dashboard-secret-reader`) that can be attached to application compute.
  - Acceptance: Role ARN output present and role can assume access to read the secret.

- Task: (Optional) Enable secret rotation
  - Provide a rotation Lambda ARN and set `enable_rotation = true` in `infra/terraform/terraform.tfvars`.
  - Acceptance: Secret rotation is attached and rotation schedule is set (Lambda handles rotation logic).

- Task: Export/transform data from SQLite
  - Export to CSV or compatible SQL.
  - Acceptance: CSV files validated and ready for import.

- Task: Import data to RDS and validate
  - Run migrations and import CSVs using `psql` / `COPY`.
  - Acceptance: Row counts and sampling match originals.

- Task: Cutover and test
  - Update production env and deploy.
  - Acceptance: All tests in `tests/` pass and app functions as expected.

- Task: Post-migration ops
  - Configure backups, monitoring, and alerts.
  - Acceptance: CloudWatch alarms and automated backups present.
