output "vpc_id" {
  description = "ID of the created VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block of the created VPC"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnets
}

output "eks_cluster_id" {
  description = "ID of the EKS cluster"
  value       = module.eks.cluster_id
}

output "eks_cluster_endpoint" {
  description = "Endpoint of the EKS cluster"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "eks_oidc_provider_arn" {
  description = "ARN of the OIDC provider for the EKS cluster"
  value       = module.eks.oidc_provider_arn
}

output "eks_node_security_group_id" {
  description = "Security group ID of the EKS nodes"
  value       = module.eks.node_security_group_id
}

output "database_endpoint" {
  description = "Endpoint of the RDS PostgreSQL instance"
  value       = module.rds.db_instance_endpoint
  sensitive   = true
}

output "database_name" {
  description = "Name of the PostgreSQL database"
  value       = module.rds.db_instance_name
}

output "database_port" {
  description = "Port of the PostgreSQL database"
  value       = module.rds.db_instance_port
}

output "database_master_username" {
  description = "Master username of the PostgreSQL database"
  value       = module.rds.db_instance_username
  sensitive   = true
}

output "database_password_secret_arn" {
  description = "ARN of the Secrets Manager secret containing the database password"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "redis_endpoint" {
  description = "Endpoint of the ElastiCache Redis cluster"
  value       = module.elasticache_redis.replication_group_primary_endpoint_address
  sensitive   = true
}

output "redis_port" {
  description = "Port of the ElastiCache Redis cluster"
  value       = module.elasticache_redis.replication_group_port
}

output "redis_replication_group_id" {
  description = "ID of the ElastiCache Redis replication group"
  value       = module.elasticache_redis.replication_group_id
}

output "load_balancer_url" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.lb_dns_name
}

output "load_balancer_arn" {
  description = "ARN of the Application Load Balancer"
  value       = module.alb.lb_arn
}

output "load_balancer_zone_id" {
  description = "Route53 zone ID of the ALB"
  value       = module.alb.lb_zone_id
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for file uploads"
  value       = aws_s3_bucket.uploads.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for file uploads"
  value       = aws_s3_bucket.uploads.arn
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = var.environment == "production" ? aws_cloudfront_distribution.cdn[0].domain_name : null
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = var.environment == "production" ? aws_cloudfront_distribution.cdn[0].id : null
}

output "ecr_backend_url" {
  description = "URL of the ECR repository for the backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_url" {
  description = "URL of the ECR repository for the frontend"
  value       = aws_ecr_repository.frontend.repository_url
}

output "route53_api_record" {
  description = "Route53 record for the API endpoint"
  value       = var.domain_name != "" ? aws_route53_record.api[0].fqdn : null
}

output "route53_app_record" {
  description = "Route53 record for the application endpoint"
  value       = var.domain_name != "" ? aws_route53_record.app[0].fqdn : null
}
