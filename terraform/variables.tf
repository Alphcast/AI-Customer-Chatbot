variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (production, staging, development)"
  type        = string
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be one of: production, staging, development"
  }
}

variable "project_name" {
  description = "Project name used as prefix for resource naming"
  type        = string
  default     = "ai-chatbot"
}

variable "domain_name" {
  description = "Domain name for the application (e.g., chatbot.example.com)"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for ALB HTTPS listener"
  type        = string
  default     = ""
}

variable "cloudfront_certificate_arn" {
  description = "ARN of ACM certificate in us-east-1 for CloudFront"
  type        = string
  default     = ""
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "intra_subnet_cidrs" {
  description = "CIDR blocks for intra subnets (database, cache)"
  type        = list(string)
  default     = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]
}

variable "cluster_endpoint_public_access_cidrs" {
  description = "CIDR blocks allowed to access EKS cluster endpoint publicly"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "eks_cluster_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.30"
}

variable "node_group_desired_size" {
  description = "Desired number of nodes in the EKS node group"
  type        = number
  default     = 3
}

variable "node_group_min_size" {
  description = "Minimum number of nodes in the EKS node group"
  type        = number
  default     = 2
}

variable "node_group_max_size" {
  description = "Maximum number of nodes in the EKS node group"
  type        = number
  default     = 10
}

variable "node_instance_types" {
  description = "EC2 instance types for the EKS node group"
  type        = list(string)
  default     = ["m6i.large", "m6a.large"]
}

variable "spot_instance_types" {
  description = "EC2 instance types for spot node group"
  type        = list(string)
  default     = ["m6i.large", "m6a.large", "c6i.large"]
}

variable "node_capacity_type" {
  description = "Capacity type for EKS nodes (ON_DEMAND or SPOT)"
  type        = string
  default     = "ON_DEMAND"
}

variable "node_volume_size" {
  description = "EBS volume size for EKS nodes in GB"
  type        = number
  default     = 100
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.large"
}

variable "rds_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "rds_max_allocated_storage" {
  description = "Maximum allocated storage for RDS autoscaling in GB"
  type        = number
  default     = 500
}

variable "rds_database_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "chatbot"
}

variable "rds_username" {
  description = "Username for PostgreSQL database"
  type        = string
  default     = "chatbot_admin"
}

variable "rds_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
  default     = false
}

variable "rds_backup_retention_days" {
  description = "Backup retention period for RDS in days"
  type        = number
  default     = 30
}

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.r6g.large"
}

variable "redis_cluster_mode_enabled" {
  description = "Enable cluster mode for Redis"
  type        = bool
  default     = false
}

variable "redis_num_cache_clusters" {
  description = "Number of Redis cache clusters (1 for single-node, 2+ for replication)"
  type        = number
  default     = 2
}

variable "redis_multi_az" {
  description = "Enable Multi-AZ for Redis replication group"
  type        = bool
  default     = false
}

variable "redis_snapshot_retention_days" {
  description = "Snapshot retention period for Redis in days"
  type        = number
  default     = 7
}

variable "upload_retention_days" {
  description = "Number of days to retain uploaded files in S3"
  type        = number
  default     = 365
}
