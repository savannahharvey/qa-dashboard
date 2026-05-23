# Migrate database to AWS Free Tier

## Summary

Move the application's database from local SQLite to an AWS-managed database that fits the AWS Free Tier constraints. Primary goal: reliable, managed Postgres instance on AWS Free Tier with minimal downtime and clear rollback procedures.

## Goals

- Zero or minimal downtime for test/dev deployments
- Preserve schema, data, and Prisma migrations
- Use only AWS Free Tier eligible resources
- Secure connections and automated backups

## Constraints & Assumptions

- Current project uses SQLite with Prisma migrations present in `prisma/migrations`.
- Free Tier eligibility: Amazon RDS for PostgreSQL (db.t4g.micro / db.t3.micro) is free for 12 months for new accounts; if account is outside free tier, choose smallest supported instance and track costs.
- We target PostgreSQL for parity with Prisma and long-term portability.

## Recommended Target

- Engine: PostgreSQL (14+)
- Instance class: db.t3.micro or db.t4g.micro (Free Tier eligible for 12 months on new accounts)
- Storage: General Purpose (gp2/gp3) — start with 20 GiB (free-tier covers small usage; ensure storage stays under free credits)

## High-level Steps

1. Prepare AWS account and networking
   - Ensure free-tier eligibility and billing alerts.
   - Create or reuse a VPC and subnet group.
   - Create a Security Group allowing only app server IPs (or VPC CIDR) on DB port 5432.

2. Provision RDS PostgreSQL instance
   - Use the smallest free-tier eligible instance and enable Public Accessibility only if needed for initial import; prefer private.
   - Enable automated backups (retention 7 days) and encryption.

3. Prepare application for Postgres
   - Update `schema.prisma` datasource provider from `sqlite` to `postgresql` and set `DATABASE_URL` example.
   - Run `prisma migrate deploy` or `prisma db push` depending on migration strategy.

4. Export data from SQLite
   - Use `sqlite3` to dump to SQL or export to CSV per table.
   - Transform types/DDL differences if necessary (e.g., `AUTOINCREMENT` -> `SERIAL` / sequences).

5. Import into RDS
   - Create an empty DB and run schema migrations on RDS.
   - Import data via `psql` or `COPY` with CSVs.

6. Switch app to new DB
   - Update `DATABASE_URL` in `config/env.ts` (or env) to point to RDS.
   - Deploy and smoke-test.

7. Verify, monitor, and finalize
   - Run integration tests and metrics checks.
   - Configure daily snapshot/backup and alarms.

8. Rollback plan
   - Keep previous `DATABASE_URL` value to revert quickly.
   - If data drift is unacceptable, stop app and restore from RDS snapshot to a test instance and re-run import.

## Prisma-specific notes

- Edit `schema.prisma` datasource block:

  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

- After provisioning DB and setting `DATABASE_URL`, run:

  - `npx prisma migrate deploy` (production-ready)
  - or `npx prisma db push --accept-data-loss` (fast, but may alter schema)

## Data migration commands (examples)

- Dump schema from SQLite (SQL):

  sqlite3 db.sqlite ".dump" > dump.sql

- Convert or extract data per-table to CSV (example):

  sqlite3 -header -csv db.sqlite "select * from users;" > users.csv

- On a machine with `psql` and network access to RDS, import CSVs:

  psql "postgresql://user:pass@host:5432/dbname" -c "\copy users FROM 'users.csv' WITH CSV HEADER"

## Security & Networking

- Use SSL/TLS for Postgres connections; enforce `?sslmode=require` in `DATABASE_URL`.
- Use IAM DB authentication only if desired; otherwise use strong rotated passwords stored in Secrets Manager or SSM Parameter Store.
- Restrict access via Security Groups and avoid exposing RDS publicly long-term.

## Terraform & Secrets Manager

- We provide a Terraform configuration in `infra/terraform` that will create the VPC, subnets, security group, DB subnet group, and an RDS PostgreSQL instance.
- If you do not supply `db_password` in `terraform.tfvars`, Terraform will generate a strong password using the `random` provider and store the credentials in AWS Secrets Manager under the secret name `qa-dashboard-db-credentials`.
- The Terraform outputs include `db_endpoint`, `db_port`, `db_identifier`, and `secrets_arn` (Secrets Manager ARN). Use `secrets_arn` to retrieve credentials securely from AWS.

Quick Terraform workflow:

```bash
cd infra/terraform
terraform init
terraform plan -out plan.tf
terraform apply plan.tf
```

After apply, build a `DATABASE_URL` with the returned outputs or fetch the secret value via the AWS CLI:

```bash
aws secretsmanager get-secret-value --secret-id <secret-arn> --query SecretString --output text
```

Use the returned JSON `username`/`password` to construct the `DATABASE_URL`.

IAM & Rotation guidance:

- Terraform will create a least-privilege IAM policy that grants `secretsmanager:GetSecretValue` and `secretsmanager:DescribeSecret` for the database secret, plus an IAM role named `qa-dashboard-secret-reader` that you can attach to your application compute (EC2 instance profile or ECS task role) to allow secure retrieval of DB credentials.
- For automatic rotation, you must provide a rotation Lambda that implements Secrets Manager's rotation interface. Set `enable_rotation = true` and `rotation_lambda_arn` in `infra/terraform/terraform.tfvars` to attach the Lambda. Terraform will not create the Lambda function.

Security recommendations:

- Attach the IAM role to the app compute instead of embedding credentials in files or environment variables where possible.
- Use Secrets Manager rotation for production workloads and rotate at an interval (e.g., 30 days).

## Backups & Monitoring

- Enable automated backups and daily snapshots.
- Configure CloudWatch alarms for CPU, connections, free storage, and errors.

## Acceptance Criteria

- App connects to RDS and passes all existing tests in `tests/`.
- All production data present and verified against exports.
- Automated backups and monitoring are active.

## Rollout timeline (estimate)

- Planning & infra prep: 1 day
- Provision RDS & network: 30–60 minutes
- Schema + data export/import: 1–3 hours (depends on data size)
- Testing and cutover: 1–2 hours

## Cost considerations

- Free-tier covers small RDS usage for 12 months on eligible accounts. Beyond that, db.t3.micro monthly cost applies. Monitor billing closely.

---

For detailed step-by-step commands and an optional Terraform plan, say whether you want an automated script or manual instructions.
