# Terraform: RDS + Networking for QA Dashboard

This folder contains a minimal Terraform configuration to provision an AWS VPC, private subnets, a DB subnet group, a security group, and a PostgreSQL RDS instance suitable for development and small workloads.

Important notes:
- Review `variables.tf` and *do not* commit real passwords to source control.
- `ssh_cidr` must be restricted to your IP range and cannot be `0.0.0.0/0`.
- Set `ssh_cidr` explicitly in `terraform.tfvars` before planning or applying.

Bastion host:
- Terraform now creates a Bastion host in a public subnet so you can test RDS connectivity from inside the VPC.
- The Bastion host is accessible only from `ssh_cidr` on port 22.
- The instance is launched with an SSM instance profile, so you can connect using AWS Systems Manager Session Manager without an SSH key pair.
- After apply, the public IP is available as output `bastion_public_ip` and the instance ID is available as `bastion_id`.

Secrets Manager integration:
- If you do not provide `db_password` in `terraform.tfvars`, Terraform will generate a strong password and store it in AWS Secrets Manager under the secret name `qa-dashboard-db-credentials`.
- The secret ARN is exposed as output `secrets_arn` after `terraform apply`.

IAM & Rotation notes:
- Terraform creates an IAM policy `qa-dashboard-db-secret-read` and a role `qa-dashboard-secret-reader` that can be attached to your application compute (EC2 instance profile or ECS task role) to grant least-privileged access to retrieve the DB credentials.
- The role's ARN and policy ARN are emitted as outputs `db_secret_reader_role_arn` and `db_secret_read_policy_arn`.
- Automatic rotation requires a Lambda implementing the Secrets Manager rotation interface. Set `enable_rotation = true` and supply `rotation_lambda_arn` in `terraform.tfvars` to attach the Lambda to the secret. Terraform will not create the Lambda for you.

Example: fetch secret and construct `DATABASE_URL` in Bash (uses `jq`):

```bash
secret_json=$(aws secretsmanager get-secret-value --secret-id $(terraform output -raw secrets_arn) --query SecretString --output text)
username=$(echo "$secret_json" | jq -r .username)
password=$(echo "$secret_json" | jq -r .password)
endpoint=$(terraform output -raw db_endpoint)
port=$(terraform output -raw db_port)
dbname=$(terraform output -raw db_name)
echo "postgresql://$username:$password@$endpoint:$port/$dbname?sslmode=require"
```

PowerShell equivalent:

```powershell
$secretJson = aws secretsmanager get-secret-value --secret-id (terraform output -raw secrets_arn) --query SecretString --output text
$secret = $secretJson | ConvertFrom-Json
$endpoint = terraform output -raw db_endpoint
$port = terraform output -raw db_port
$dbname = terraform output -raw db_name
"postgresql://$($secret.username):$($secret.password)@$endpoint`:$port/$dbname?sslmode=require"
```

Quick start:

1. Configure AWS credentials (environment, shared credentials file, or AWS CLI).

2. Create `terraform.tfvars` with at least `db_password` set. Example file `terraform.tfvars.example` is provided.

3. Initialize and apply:

```bash
cd infra/terraform
terraform init
terraform plan -out plan.tfplan
terraform apply plan.tfplan
```

After apply, fetch DB endpoint from output `db_endpoint` and set your `DATABASE_URL` accordingly:

postgresql://<username>:<password>@<endpoint>:<port>/<dbname>?sslmode=require
