variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "ssh_cidr" {
  description = "CIDR range allowed to SSH to the bastion host. Must be your IP or a restricted range."
  type        = string
  default     = ""

  validation {
    condition     = var.ssh_cidr != "" && var.ssh_cidr != "0.0.0.0/0"
    error_message = "ssh_cidr must be set to a restricted CIDR block, not 0.0.0.0/0."
  }
}

variable "bastion_instance_type" {
  description = "EC2 instance type for the bastion host. Free-tier eligible types: t3.micro or t4g.micro."
  type        = string
  default     = "t3.micro"
}

variable "db_instance_class" {
  description = "RDS instance class (free-tier: db.t3.micro or db.t4g.micro)"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Initial database name"
  type        = string
  default     = "qa_dashboard"
}

variable "db_username" {
  description = "Master DB username"
  type        = string
  default     = "qa_admin"
}

variable "db_password" {
  description = "Master DB password (supply via tfvars or environment). If null, Terraform will generate a random password and store it in Secrets Manager."
  type        = string
  sensitive   = true
  default     = null
}

variable "enable_rotation" {
  description = "Whether to expect/enable rotation for the secret. Actual rotation Lambda must be provided via `rotation_lambda_arn` or created separately."
  type        = bool
  default     = false
}

variable "rotation_lambda_arn" {
  description = "Optional ARN of a Lambda that implements Secrets Manager rotation. If provided, Terraform will attach it to the secret."
  type        = string
  default     = ""
}
