#!/bin/bash

# Deploy script for Google Cloud Run
# Usage: ./scripts/deploy-gcp.sh [version]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PROJECT_ID is set
if [ -z "$GCP_PROJECT_ID" ]; then
    echo -e "${RED}Error: GCP_PROJECT_ID environment variable is not set${NC}"
    echo "Usage: export GCP_PROJECT_ID=your-project-id"
    exit 1
fi

# Get version from argument or use timestamp
if [ -z "$1" ]; then
    VERSION="v$(date +%Y%m%d-%H%M%S)"
    echo -e "${YELLOW}No version specified, using: $VERSION${NC}"
else
    VERSION="$1"
fi

REGION="southamerica-east1"
SERVICE_NAME="valorize-api"
REPO_NAME="valorize-api"
IMAGE_NAME="$REGION-docker.pkg.dev/$GCP_PROJECT_ID/$REPO_NAME/api"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deploying Valorize API to Cloud Run${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Project: ${YELLOW}$GCP_PROJECT_ID${NC}"
echo -e "Version: ${YELLOW}$VERSION${NC}"
echo -e "Region: ${YELLOW}$REGION${NC}"
echo ""

# Step 1: Build Docker image
echo -e "${GREEN}[1/3] Building Docker image...${NC}"
docker build --platform linux/amd64 \
    -t "$IMAGE_NAME:latest" \
    -t "$IMAGE_NAME:$VERSION" \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build completed successfully${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

# Step 2: Push to Artifact Registry
echo -e "\n${GREEN}[2/3] Pushing image to Artifact Registry...${NC}"
docker push "$IMAGE_NAME:latest"
docker push "$IMAGE_NAME:$VERSION"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Push completed successfully${NC}"
else
    echo -e "${RED}✗ Push failed${NC}"
    exit 1
fi

# Step 3: Deploy to Cloud Run
echo -e "\n${GREEN}[3/3] Deploying to Cloud Run...${NC}"
gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_NAME:$VERSION" \
    --region "$REGION" \
    --platform managed

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --region "$REGION" \
        --format 'value(status.url)')
    
    echo -e "\nService URL: ${YELLOW}$SERVICE_URL${NC}"
    echo -e "\nQuick tests:"
    echo -e "  Health check: ${YELLOW}curl $SERVICE_URL/health${NC}"
    echo -e "  Swagger docs: ${YELLOW}$SERVICE_URL/docs${NC}"
    echo -e "\nView logs:"
    echo -e "  ${YELLOW}gcloud run services logs tail $SERVICE_NAME --region $REGION${NC}"
else
    echo -e "\n${RED}✗ Deployment failed${NC}"
    exit 1
fi

