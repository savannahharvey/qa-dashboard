output "db_endpoint" {
  description = "RDS endpoint address"
  value       = aws_db_instance.postgres.address
}

output "db_port" {
  description = "RDS port"
  value       = aws_db_instance.postgres.port
}

output "db_identifier" {
  description = "RDS instance identifier"
  value       = aws_db_instance.postgres.id
}

output "db_name" {
  description = "Initial PostgreSQL database name"
  value       = var.db_name
}

output "secrets_arn" {
  description = "ARN of the Secrets Manager secret holding DB credentials"
  value       = aws_secretsmanager_secret.db_secret.arn
}

output "db_secret_reader_role_arn" {
  description = "IAM role ARN to attach to application compute for read-only access to the DB secret"
  value       = aws_iam_role.secret_reader_role.arn
}

output "db_secret_read_policy_arn" {
  description = "IAM policy ARN granting read access to the DB secret"
  value       = aws_iam_policy.db_secret_read.arn
}

output "bastion_public_ip" {
  description = "Public IP address of the bastion host"
  value       = aws_instance.bastion.public_ip
}

output "bastion_id" {
  description = "EC2 instance ID for the bastion host"
  value       = aws_instance.bastion.id
}

