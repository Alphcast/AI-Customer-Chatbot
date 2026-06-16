#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# AI Customer Chatbot - Production Deployment Script
# =============================================================================
# Usage:
#   ./scripts/deploy.sh [environment] [version]
#
# Arguments:
#   environment   Target environment: staging | production (default: staging)
#   version       Release version tag (default: auto-generated timestamp)
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-staging}"
VERSION="${2:-$(date -u +%Y%m%d%H%M%S)-$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')}"
K8S_NAMESPACE="chatbot-platform"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io/your-org}"
BACKEND_IMAGE="${DOCKER_REGISTRY}/chatbot-platform/backend"
FRONTEND_IMAGE="${DOCKER_REGISTRY}/chatbot-platform/frontend"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"
ROLLBACK_VERSION=""

# -----------------------------------------------------------------------------
# Utility Functions
# -----------------------------------------------------------------------------

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

notify_slack() {
    local status="$1"
    local message="$2"
    local color="$3"

    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -s -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"Deployment: $ENVIRONMENT\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                        {\"title\": \"Version\", \"value\": \"$VERSION\", \"short\": true},
                        {\"title\": \"Status\", \"value\": \"$status\", \"short\": true}
                    ],
                    \"footer\": \"AI Chatbot Deployment Bot\",
                    \"ts\": $(date +%s)
                }]
            }" "$SLACK_WEBHOOK" > /dev/null 2>&1 || true
    fi
}

check_prerequisites() {
    local missing=0

    log_info "Checking prerequisites..."

    command -v git > /dev/null 2>&1 || { log_error "git is required but not installed"; missing=1; }
    command -v docker > /dev/null 2>&1 || { log_error "docker is required but not installed"; missing=1; }
    command -v kubectl > /dev/null 2>&1 || { log_error "kubectl is required but not installed"; missing=1; }
    command -v kustomize > /dev/null 2>&1 || { log_warning "kustomize not found, using kubectl directly"; }

    if [[ "$missing" -eq 1 ]]; then
        log_error "Missing required dependencies. Aborting."
        exit 1
    fi

    log_success "All prerequisites met"
}

check_git_status() {
    log_info "Checking git status..."

    if [[ -n "$(git status --porcelain)" ]]; then
        log_warning "There are uncommitted changes in the repository"
        read -rp "Continue anyway? (y/N) " confirm
        if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
            log_info "Deployment cancelled by user"
            exit 0
        fi
    fi

    local current_branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)

    if [[ "$ENVIRONMENT" == "production" && "$current_branch" != "main" ]]; then
        log_error "Production deployments must be from the 'main' branch (currently on '$current_branch')"
        exit 1
    fi

    log_success "Git status OK (branch: $current_branch)"
}

# -----------------------------------------------------------------------------
# Build Phase
# -----------------------------------------------------------------------------

build_images() {
    log_info "Building Docker images (version: $VERSION)..."

    log_info "Building backend image..."
    docker build \
        -t "${BACKEND_IMAGE}:${VERSION}" \
        -t "${BACKEND_IMAGE}:latest" \
        --cache-from "${BACKEND_IMAGE}:latest" \
        -f "${PROJECT_DIR}/backend/Dockerfile" \
        "${PROJECT_DIR}/backend"

    log_success "Backend image built successfully"

    log_info "Building frontend image..."
    docker build \
        -t "${FRONTEND_IMAGE}:${VERSION}" \
        -t "${FRONTEND_IMAGE}:latest" \
        --cache-from "${FRONTEND_IMAGE}:latest" \
        -f "${PROJECT_DIR}/frontend/Dockerfile" \
        "${PROJECT_DIR}/frontend"

    log_success "Frontend image built successfully"
}

push_images() {
    log_info "Pushing Docker images to registry..."

    if [[ -z "${DOCKER_USERNAME:-}" || -z "${DOCKER_PASSWORD:-}" ]]; then
        log_warning "Docker credentials not set. Attempting to use existing login..."
    else
        echo "$DOCKER_PASSWORD" | docker login "$DOCKER_REGISTRY" -u "$DOCKER_USERNAME" --password-stdin
    fi

    docker push "${BACKEND_IMAGE}:${VERSION}"
    docker push "${BACKEND_IMAGE}:latest"
    log_success "Backend image pushed"

    docker push "${FRONTEND_IMAGE}:${VERSION}"
    docker push "${FRONTEND_IMAGE}:latest"
    log_success "Frontend image pushed"
}

# -----------------------------------------------------------------------------
# Database Migration Phase
# -----------------------------------------------------------------------------

run_migrations() {
    log_info "Running database migrations..."

    local pod_name
    pod_name=$(kubectl get pods -n "$K8S_NAMESPACE" -l app=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

    if [[ -n "$pod_name" ]]; then
        kubectl exec -n "$K8S_NAMESPACE" "$pod_name" -- npx prisma migrate deploy
        log_success "Database migrations completed"
    else
        log_warning "No running backend pod found. Will run migrations as a job..."

        kubectl run migration-runner --image="${BACKEND_IMAGE}:${VERSION}" \
            -n "$K8S_NAMESPACE" \
            --restart=Never \
            --command -- sh -c "npx prisma migrate deploy && npx prisma db seed"
        kubectl wait --for=condition=complete --timeout=300s -n "$K8S_NAMESPACE" pod/migration-runner
        kubectl delete pod migration-runner -n "$K8S_NAMESPACE"
        log_success "Migration job completed"
    fi
}

run_seed() {
    log_info "Running database seed..."

    kubectl run seed-runner --image="${BACKEND_IMAGE}:${VERSION}" \
        -n "$K8S_NAMESPACE" \
        --restart=Never \
        --command -- sh -c "npx prisma db seed"

    kubectl wait --for=condition=complete --timeout=120s -n "$K8S_NAMESPACE" pod/seed-runner || true
    kubectl delete pod seed-runner -n "$K8S_NAMESPACE" 2>/dev/null || true
    log_success "Database seed completed"
}

# -----------------------------------------------------------------------------
# Deploy Phase
# -----------------------------------------------------------------------------

deploy_to_kubernetes() {
    log_info "Deploying to Kubernetes (environment: $ENVIRONMENT)..."

    # Update image tags in kustomization
    cd "${PROJECT_DIR}/kubernetes"
    if command -v kustomize > /dev/null 2>&1; then
        kustomize edit set image "chatbot-platform/backend=${BACKEND_IMAGE}:${VERSION}"
        kustomize edit set image "chatbot-platform/frontend=${FRONTEND_IMAGE}:${VERSION}"
    else
        log_warning "kustomize not available, using sed to update image tags"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|chatbot-platform/backend:.*|chatbot-platform/backend:${VERSION}|g" kustomization.yaml
            sed -i '' "s|chatbot-platform/frontend:.*|chatbot-platform/frontend:${VERSION}|g" kustomization.yaml
        else
            sed -i "s|chatbot-platform/backend:.*|chatbot-platform/backend:${VERSION}|g" kustomization.yaml
            sed -i "s|chatbot-platform/frontend:.*|chatbot-platform/frontend:${VERSION}|g" kustomization.yaml
        fi
    fi

    # Apply manifests
    kubectl apply -k . --namespace "$K8S_NAMESPACE"
    cd "$PROJECT_DIR"

    log_success "Kubernetes manifests applied"
}

monitor_rollout() {
    local deployment="$1"
    local timeout="$2"

    log_info "Monitoring rollout of $deployment (timeout: ${timeout}s)..."

    kubectl rollout status "deployment/$deployment" \
        --namespace "$K8S_NAMESPACE" \
        --timeout="${timeout}s"

    log_success "Rollout of $deployment completed successfully"
}

# -----------------------------------------------------------------------------
# Health Check Phase
# -----------------------------------------------------------------------------

health_check() {
    log_info "Running health checks..."

    local backend_pods
    backend_pods=$(kubectl get pods -n "$K8S_NAMESPACE" -l app=backend -o jsonpath='{.items[*].status.phase}')
    if echo "$backend_pods" | grep -q "Running"; then
        log_success "Backend pods are running"
    else
        log_error "Backend pods are not running"
        return 1
    fi

    local frontend_pods
    frontend_pods=$(kubectl get pods -n "$K8S_NAMESPACE" -l app=frontend -o jsonpath='{.items[*].status.phase}')
    if echo "$frontend_pods" | grep -q "Running"; then
        log_success "Frontend pods are running"
    else
        log_error "Frontend pods are not running"
        return 1
    fi

    # Get backend service endpoint
    local backend_host=""
    if [[ "$ENVIRONMENT" == "production" ]]; then
        backend_host="https://api.chatbot.example.com"
    else
        backend_host="https://staging-api.chatbot.example.com"
    fi

    # Perform HTTP health check
    log_info "Performing HTTP health check against backend..."
    for i in {1..12}; do
        local http_status
        http_status=$(curl -s -o /dev/null -w "%{http_code}" "${backend_host}/api/v1/health" 2>/dev/null || echo "000")

        if [[ "$http_status" == "200" ]]; then
            log_success "Health check passed (HTTP $http_status)"
            return 0
        fi
        log_info "Health check attempt $i/12 returned HTTP $http_status, waiting..."
        sleep 10
    done

    log_error "Health check failed after 12 attempts"
    return 1
}

# -----------------------------------------------------------------------------
# Backup & Rollback
# -----------------------------------------------------------------------------

backup_current_state() {
    log_info "Creating backup of current Kubernetes state..."

    local backup_dir="${PROJECT_DIR}/backups/${ENVIRONMENT}_${VERSION}"
    mkdir -p "$backup_dir"

    kubectl get deployments -n "$K8S_NAMESPACE" -o yaml > "${backup_dir}/deployments.yaml" 2>/dev/null || true
    kubectl get services -n "$K8S_NAMESPACE" -o yaml > "${backup_dir}/services.yaml" 2>/dev/null || true
    kubectl get configmap -n "$K8S_NAMESPACE" -o yaml > "${backup_dir}/configmap.yaml" 2>/dev/null || true

    kubectl get deployment backend -n "$K8S_NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}' > "${backup_dir}/backend_image.txt" 2>/dev/null || true
    kubectl get deployment frontend -n "$K8S_NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}' > "${backup_dir}/frontend_image.txt" 2>/dev/null || true

    ROLLBACK_VERSION=$(cat "${backup_dir}/backend_image.txt" 2>/dev/null || echo "unknown")
    log_success "Backup saved to ${backup_dir}"
}

rollback() {
    log_error "Deployment failed. Initiating rollback..."

    notify_slack "ROLLING BACK" "Deployment to $ENVIRONMENT failed. Rolling back to $ROLLBACK_VERSION." "danger"

    if [[ -n "$ROLLBACK_VERSION" && "$ROLLBACK_VERSION" != "unknown" ]]; then
        log_info "Rolling backend to: $ROLLBACK_VERSION"
        kubectl set image deployment/backend \
            -n "$K8S_NAMESPACE" \
            "backend=${ROLLBACK_VERSION}" --record

        log_info "Rolling frontend to: $ROLLBACK_VERSION"
        kubectl set image deployment/frontend \
            -n "$K8S_NAMESPACE" \
            "frontend=${ROLLBACK_VERSION}" --record

        monitor_rollout "backend" 300
        monitor_rollout "frontend" 300
        monitor_rollout "worker" 300

        log_success "Rollback completed"
    else
        log_info "No rollback version found. Performing undo..."
        kubectl rollout undo deployment/backend -n "$K8S_NAMESPACE"
        kubectl rollout undo deployment/frontend -n "$K8S_NAMESPACE"
        kubectl rollout undo deployment/worker -n "$K8S_NAMESPACE"

        monitor_rollout "backend" 300
        monitor_rollout "frontend" 300
        monitor_rollout "worker" 300
    fi

    health_check || log_error "Rollback health check also failed - manual intervention required"
}

# -----------------------------------------------------------------------------
# Cleanup
# -----------------------------------------------------------------------------

cleanup() {
    log_info "Cleaning up..."

    # Keep only the last 5 images locally
    docker image prune -f --filter "until=24h" > /dev/null 2>&1 || true

    # Remove old backups (keep last 10)
    if [[ -d "${PROJECT_DIR}/backups" ]]; then
        ls -t "${PROJECT_DIR}/backups" | tail -n +11 | while read -r dir; do
            rm -rf "${PROJECT_DIR}/backups/$dir"
            log_info "Removed old backup: $dir"
        done
    fi

    log_success "Cleanup completed"
}

# -----------------------------------------------------------------------------
# Main Deployment Pipeline
# -----------------------------------------------------------------------------

main() {
    echo ""
    echo "============================================================================="
    echo -e "${CYAN}  AI Customer Chatbot - Deployment Pipeline${NC}"
    echo "============================================================================="
    echo -e "  Environment:  ${GREEN}${ENVIRONMENT}${NC}"
    echo -e "  Version:      ${GREEN}${VERSION}${NC}"
    echo -e "  Registry:     ${GREEN}${DOCKER_REGISTRY}${NC}"
    echo "============================================================================="
    echo ""

    notify_slack "STARTED" "Deployment to $ENVIRONMENT started (version: $VERSION)" "warning"

    # Phase 0: Prerequisites
    log_info "Phase 0: Prerequisites"
    check_prerequisites
    check_git_status

    # Phase 1: Backup
    log_info "Phase 1: Backup current state"
    backup_current_state

    # Phase 2: Build
    log_info "Phase 2: Building Docker images"
    build_images

    # Phase 3: Push
    log_info "Phase 3: Pushing images to registry"
    push_images

    # Phase 4: Migrate
    log_info "Phase 4: Running database migrations"
    run_migrations

    # Phase 5: Deploy
    log_info "Phase 5: Deploying to Kubernetes"
    deploy_to_kubernetes

    # Phase 6: Monitor
    log_info "Phase 6: Monitoring rollout"
    monitor_rollout "backend" 300 || { rollback; exit 1; }
    monitor_rollout "frontend" 300 || { rollback; exit 1; }
    monitor_rollout "worker" 300  || { rollback; exit 1; }

    # Phase 7: Health Check
    log_info "Phase 7: Running health checks"
    health_check || { rollback; exit 1; }

    # Phase 8: Seed (if needed)
    if [[ "${RUN_SEED:-false}" == "true" ]]; then
        log_info "Phase 8: Running database seed"
        run_seed
    fi

    # Phase 9: Cleanup
    log_info "Phase 9: Cleanup"
    cleanup

    # Success
    echo ""
    echo "============================================================================="
    echo -e "${GREEN}  🚀 Deployment completed successfully!${NC}"
    echo "============================================================================="
    echo -e "  Environment:  ${ENVIRONMENT}"
    echo -e "  Version:      ${VERSION}"
    echo "============================================================================="
    echo ""

    notify_slack "SUCCESS" "Deployment to $ENVIRONMENT completed successfully (version: $VERSION)" "good"
}

# Trap errors for rollback
trap 'log_error "Deployment failed at line $LINENO"; rollback; exit 1' ERR

# Run main
main "$@"
