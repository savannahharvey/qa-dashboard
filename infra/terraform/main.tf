resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  tags = {
    Name = "qa-dashboard-vpc"
  }
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, 1)
  availability_zone = data.aws_availability_zones.available.names[0]
  tags              = { Name = "qa-dashboard-private-a" }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, 2)
  availability_zone = data.aws_availability_zones.available.names[1]
  tags              = { Name = "qa-dashboard-private-b" }
}

data "aws_availability_zones" "available" {}

data "aws_ami" "bastion" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_db_subnet_group" "rds_subnets" {
  name       = "qa-dashboard-db-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  tags       = { Name = "qa-dashboard-db-subnet-group" }
}

resource "aws_internet_gateway" "public" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "qa-dashboard-igw" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.public.id
  }
  tags = { Name = "qa-dashboard-public-rt" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, 3)
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true
  tags                    = { Name = "qa-dashboard-public" }
}

resource "aws_security_group" "rds_sg" {
  name        = "qa-dashboard-rds-sg"
  description = "Allow Postgres access from bastion host"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "bastion_sg" {
  name        = "qa-dashboard-bastion-sg"
  description = "Allow SSH access to bastion host"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_iam_instance_profile" "bastion" {
  name = "qa-dashboard-bastion-profile"
  role = aws_iam_role.bastion.name
}

resource "aws_instance" "bastion" {
  ami                         = data.aws_ami.bastion.id
  instance_type               = var.bastion_instance_type
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.bastion_sg.id]
  associate_public_ip_address = true
  iam_instance_profile        = aws_iam_instance_profile.bastion.name

  tags = {
    Name = "qa-dashboard-bastion"
  }
}

resource "aws_iam_role" "bastion" {
  name               = "qa-dashboard-bastion-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role_policy_attachment" "bastion_ssm" {
  role       = aws_iam_role.bastion.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "random_password" "db" {
  length           = 20
  override_special = "!@#%&*()_+-="
  special          = true
  upper            = true
  lower            = true
  numeric          = true
}

resource "aws_secretsmanager_secret" "db_secret" {
  name        = "qa-dashboard-db-credentials"
  description = "RDS master credentials for qa-dashboard"
}

resource "aws_secretsmanager_secret_version" "db_secret_value" {
  secret_id = aws_secretsmanager_secret.db_secret.id
  secret_string = jsonencode({
    username = var.db_username,
    password = var.db_password != null ? var.db_password : random_password.db.result
  })
}

# Attach rotation Lambda if provided
resource "aws_secretsmanager_secret_rotation" "db_rotation" {
  count               = var.enable_rotation && length(var.rotation_lambda_arn) > 0 ? 1 : 0
  secret_id           = aws_secretsmanager_secret.db_secret.id
  rotation_lambda_arn = var.rotation_lambda_arn
  rotation_rules {
    automatically_after_days = 30
  }
}

data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com", "ecs-tasks.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "secret_reader_role" {
  name               = "qa-dashboard-secret-reader"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

data "aws_iam_policy_document" "db_secret_read" {
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]
    resources = [aws_secretsmanager_secret.db_secret.arn]
  }
}

resource "aws_iam_policy" "db_secret_read" {
  name   = "qa-dashboard-db-secret-read"
  path   = "/"
  policy = data.aws_iam_policy_document.db_secret_read.json
}

resource "aws_iam_role_policy_attachment" "attach_secret_read" {
  role       = aws_iam_role.secret_reader_role.name
  policy_arn = aws_iam_policy.db_secret_read.arn
}

resource "aws_db_instance" "postgres" {
  identifier              = "qa-dashboard-postgres"
  engine                  = "postgres"
  instance_class          = var.db_instance_class
  db_name                 = var.db_name
  username                = var.db_username
  password                = var.db_password != null ? var.db_password : random_password.db.result
  allocated_storage       = 20
  storage_type            = "gp2"
  publicly_accessible     = false
  db_subnet_group_name    = aws_db_subnet_group.rds_subnets.name
  vpc_security_group_ids  = [aws_security_group.rds_sg.id]
  skip_final_snapshot     = true
  backup_retention_period = 7
  apply_immediately       = true
  deletion_protection     = false

  tags = { Name = "qa-dashboard-postgres" }
}
