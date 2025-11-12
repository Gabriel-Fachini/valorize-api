# CI/CD Pipeline Setup Guide - Valorize API

Complete guide to setting up and managing the automated CI/CD pipeline with GitHub Actions, SonarCloud, and Google Cloud Run deployment.

---

## 📋 Overview

The Valorize API uses a **fully automated CI/CD pipeline** with:

- ✅ **Continuous Integration (CI)**: Automated tests, linting, and builds on every PR and push
- ✅ **Code Quality**: SonarCloud analysis for security, coverage, and technical debt
- ✅ **Continuous Deployment (CD)**: Automatic deployment to Google Cloud Run on main branch
- ✅ **Quality Gates**: PR approval blocked if tests or quality checks fail

**Typical workflow**:
```
Developer commits → CI runs → SonarCloud analyzes → Tests pass?
  ✅ YES → Approve PR → Merge → CD runs → Deploy to production
  ❌ NO → Block PR → Fix issues → Re-run CI
```

---

## 🚀 Initial Setup (One-time)

### Step 1: Create SonarCloud Account

1. Go to [sonarcloud.io](https://sonarcloud.io)
2. Click "Log in" and select "GitHub"
3. Authorize the OAuth application (allows SonarCloud to access your repos)
4. After login, you'll see your account dashboard

### Step 2: Create Organization in SonarCloud

1. In SonarCloud dashboard, click "+" or "Create Organization"
2. Choose "GitHub" as the platform
3. Select your GitHub organization or personal account
4. Name the organization (e.g., `gabriel-fachini`)
5. Click "Create Organization"

### Step 3: Import Valorize API Project

1. In SonarCloud, click "Analyze New Project"
2. Select `valorize-api` repository
3. Select "With GitHub Actions" for integration type
4. SonarCloud will show you configuration steps
5. **Important**: Copy and save these values:
   - `SONAR_TOKEN` ← Keep this secret!
   - `SONAR_ORGANIZATION` ← Your org key
   - `SONAR_PROJECT_KEY` ← Project key

### Step 4: Add GitHub Secrets

These secrets are used by the workflows to authenticate with SonarCloud and GCP.

#### 4a. SonarCloud Secrets

1. Go to GitHub repository settings → "Secrets and variables" → "Actions"
2. Click "New repository secret" and add:

| Secret Name | Value | Where to Get |
|-------------|-------|-------------|
| `SONAR_TOKEN` | Your token from SonarCloud | SonarCloud → Account → Security |
| `SONAR_ORGANIZATION` | Your org key | SonarCloud → Organization |
| `SONAR_PROJECT_KEY` | Project key | SonarCloud → Project → Administration |

#### 4b. GCP Secrets for Deployment

**4b.1 Get GCP_PROJECT_ID**:
```bash
# Run locally if you have gcloud CLI
gcloud config get-value project
```

**4b.2 Create Service Account and Get GCP_SA_KEY**:

If you don't already have a service account for GitHub Actions:

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions CI/CD"

# Assign necessary roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Create JSON key
gcloud iam service-accounts keys create ~/github-actions-key.json \
  --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

Then:
```bash
# Copy the entire JSON content
cat ~/github-actions-key.json

# Paste into GitHub Secret GCP_SA_KEY
```

**In GitHub**:
1. Go to repository settings → "Secrets and variables" → "Actions"
2. Click "New repository secret" and add:

| Secret Name | Value |
|-------------|-------|
| `GCP_PROJECT_ID` | Your GCP project ID (e.g., `valorize-api-prod`) |
| `GCP_SA_KEY` | **Entire JSON** from service account key file |

⚠️ **IMPORTANT**: The JSON contains sensitive credentials. Never commit it to git!

#### 4c. Production Environment Secrets

If your CD workflow deploys with environment variables (recommended for sensitive data):

```bash
# In GitHub Secrets, also add these for production:
```

| Secret Name | Value | Example |
|-------------|-------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `AUTH0_DOMAIN` | Your Auth0 domain | `your-tenant.auth0.com` |
| `AUTH0_AUDIENCE` | Auth0 API audience | `https://api.valorize.com` |
| `AUTH0_CLIENT_ID` | Auth0 client ID | (long alphanumeric string) |
| `AUTH0_CLIENT_SECRET` | Auth0 client secret | ⚠️ Never commit! |
| `TREMENDOUS_API_KEY` | Tremendous API key | ⚠️ Never commit! |
| `TREMENDOUS_BASE_URL` | Tremendous API URL | `https://api.tremendous.com` |
| `SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anon key | (long token) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | ⚠️ Never commit! |
| `CORS_ORIGIN` | Allowed CORS origin | `https://app.valorize.com` |

### Step 5: Verify Google Cloud Run Setup

```bash
# Check Cloud Run service exists
gcloud run services list --region southamerica-east1

# Check Artifact Registry repository exists
gcloud artifacts repositories list --location southamerica-east1

# If neither exist, create them:

# Create Artifact Registry repository (one-time)
gcloud artifacts repositories create valorize \
  --repository-format=docker \
  --location=southamerica-east1 \
  --description="Valorize API Docker images"

# Create Cloud Run service (one-time)
gcloud run create valorize-api \
  --source . \
  --region southamerica-east1 \
  --platform managed \
  --allow-unauthenticated
```

---

## 🔄 How the Pipelines Work

### CI Pipeline (`.github/workflows/ci.yml`)

**When it runs**:
- On every push to `main` or `develop`
- On every pull request to `main` or `develop`

**What it does**:
1. **Setup**: Checkout code, install Node 18, restore npm cache
2. **Lint**: Run ESLint to check code style
3. **Test**: Run Vitest with coverage reporting
4. **Build**: Compile TypeScript with strict options
5. **SonarCloud**: Upload results and analyze code quality
6. **Quality Gate**: Check if quality criteria are met

**Duration**: ~3-5 minutes

**Success indicators**:
- ✅ All checks pass in GitHub
- ✅ SonarCloud shows analysis
- ✅ Coverage report visible

**Failure handling**:
- ❌ PR merge is blocked
- ❌ CI must pass before merge
- ❌ View detailed logs in GitHub Actions

### CD Pipeline (`.github/workflows/cd.yml`)

**When it runs**:
- **Automatically**: After CI passes on `main` branch
- **Manually**: Click "Run workflow" in GitHub Actions tab

**What it does**:
1. **Test & Build**: Run CI checks again
2. **Authenticate**: Connect to Google Cloud with service account
3. **Build Docker**: Create multi-architecture Docker image
4. **Push Image**: Push to Artifact Registry
5. **Deploy**: Deploy image to Cloud Run service
6. **Health Check**: Verify service is responding
7. **Notify**: Report deployment success/failure

**Duration**: ~5-8 minutes

**After deployment**:
- Service is live at: `https://valorize-api-xxxxx.run.app`
- Migrations run automatically via `docker-entrypoint.sh`
- Old versions available for quick rollback

---

## 🚨 Troubleshooting

### CI Pipeline Issues

#### "Tests failed"
```bash
# Run tests locally to debug
npm run ci:test

# Or run in watch mode
npm test -- --watch
```

#### "ESLint errors"
```bash
# Check what's wrong
npm run lint

# Auto-fix style issues
npm run lint:fix
```

#### "Build errors"
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build:prod
```

#### "SonarCloud not analyzing"
- Check `SONAR_TOKEN` is correct (copy-paste from SonarCloud)
- Verify `sonar-project.properties` exists
- Check GitHub Secrets are set (Settings → Secrets)
- Re-run workflow manually from GitHub Actions tab

### CD Pipeline Issues

#### "Deployment failed"
1. Check Cloud Run logs:
   ```bash
   gcloud run logs read valorize-api --region southamerica-east1
   ```

2. Common causes:
   - ❌ Environment variables missing (check `GCP_SA_KEY` secret)
   - ❌ Database connection failed (check `DATABASE_URL`)
   - ❌ Docker build error (check `Dockerfile`)
   - ❌ Service account permissions insufficient

3. **Rollback** (revert to previous version):
   ```bash
   gcloud run services update-traffic valorize-api \
     --to-revisions PREVIOUS_REVISION=100 \
     --region southamerica-east1
   ```

#### "Authentication failed"
```bash
# Verify service account has correct permissions
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions@*"

# Should show: roles/run.admin, roles/artifactregistry.writer, roles/iam.serviceAccountUser
```

#### "Image not found"
```bash
# Verify image was pushed
gcloud artifacts docker images list southamerica-east1-docker.pkg.dev/YOUR_PROJECT_ID/valorize/

# Check Artifact Registry repository exists
gcloud artifacts repositories list --location southamerica-east1
```

---

## 📊 Monitoring

### View CI/CD Workflow Runs

1. Go to GitHub repository → "Actions" tab
2. Click workflow name (`CI` or `CD`)
3. View all past runs with status

### SonarCloud Dashboard

1. Go to [sonarcloud.io](https://sonarcloud.io)
2. Select your organization
3. Click `valorize-api` project
4. View:
   - Code quality grade
   - Test coverage %
   - Security vulnerabilities
   - Technical debt
   - Lines of code trends

### Google Cloud Run Monitoring

```bash
# View recent deployments
gcloud run services describe valorize-api --region southamerica-east1

# View logs
gcloud run logs read valorize-api --region southamerica-east1 --limit 50

# View metrics
gcloud monitoring time-series list \
  --filter 'resource.type="cloud_run_revision"'
```

---

## 🔐 Security Best Practices

### GitHub Secrets Management

✅ **DO**:
- Store all sensitive data in GitHub Secrets (never in code)
- Use separate secrets for different environments
- Rotate secrets regularly
- Use least-privilege service accounts (minimal permissions)
- Audit who has access to secrets

❌ **DON'T**:
- Commit `.env` files with actual values
- Store secrets in workflow files
- Share `GCP_SA_KEY` JSON outside GitHub
- Use same secrets across environments
- Ignore secret rotation

### Service Account Security

```bash
# Review permissions regularly
gcloud projects get-iam-policy YOUR_PROJECT_ID

# Rotate service account key every 90 days
gcloud iam service-accounts keys list \
  --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com

# Delete old keys
gcloud iam service-accounts keys delete KEY_ID \
  --iam-account=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### Branch Protection Rules

Recommended GitHub branch protection rules for `main`:

1. Go to Settings → Branches → Add rule for `main`
2. Enable:
   - ✅ "Require a pull request before merging"
   - ✅ "Require approval from the code owner"
   - ✅ "Require status checks to pass before merging"
   - ✅ "Require branches to be up to date before merging"
   - ✅ "Require code quality check to pass" (if SonarCloud gate enabled)
3. Status checks required:
   - `test-and-build` (from CI workflow)
   - `sonarcloud` (from CI workflow)

---

## 📚 Useful Commands

### Local Testing (Before Pushing)

```bash
# Run everything that CI runs
npm run ci

# Just tests with coverage
npm run ci:test

# Just linting
npm run lint

# Just build
npm run build:prod
```

### Manual Deployment

If you need to deploy without going through GitHub:

```bash
# Using existing deploy script
bash scripts/deploy-gcp.sh

# Or manually
gcloud run deploy valorize-api \
  --source . \
  --region southamerica-east1 \
  --platform managed \
  --allow-unauthenticated
```

### Workflow Debugging

```bash
# Check secret is set (value is hidden)
gh secret list --repo gabriel-fachini/valorize-api

# View workflow YAML
cat .github/workflows/ci.yml

# List recent workflow runs
gh run list --repo gabriel-fachini/valorize-api

# View specific run logs
gh run view RUN_ID --log-failed
```

---

## 🎯 Quality Gates

SonarCloud Quality Gates determine when code is production-ready.

### Default "Sonar Way" Gates
- Coverage: > 70% (lines covered by tests)
- Duplications: < 3% (code duplication)
- Maintainability: A (technical debt acceptable)
- Reliability: A (no bugs)
- Security: A (no vulnerabilities)

### Customizing Quality Gates

1. Go to SonarCloud → Project → Quality Gates
2. Click "Create new quality gate" or edit existing
3. Set metrics:
   - Coverage on new code: > 80%
   - Critical issues: 0
   - Blocker issues: 0
   - Technical debt: < 5%
4. Set as "Default" gate
5. Save changes

---

## 📝 Common Configuration Changes

### Change Test Database Name

In `.github/workflows/ci.yml`, service config:
```yaml
services:
  postgres:
    env:
      POSTGRES_DB: valorize_test  # Change here
```

### Change Cloud Run Region

In `.github/workflows/cd.yml` and `sonar-project.properties`:
```yaml
REGISTRY_REGION: southamerica-east1  # Change here
CLOUD_RUN_SERVICE: valorize-api
```

### Add New Environment Variables

1. Add to CD workflow `.github/workflows/cd.yml`:
   ```yaml
   --set-env-vars VAR_NAME=${{ secrets.VAR_NAME }}
   ```

2. Add secret in GitHub:
   - Settings → Secrets → New secret
   - Name: `VAR_NAME`
   - Value: actual value

### Increase Coverage Threshold

In `vitest.config.ts`:
```typescript
coverage: {
  thresholds: {
    lines: 80,      // Change from 70
    functions: 80,  // Change from 70
    branches: 80,   // Change from 70
    statements: 80, // Change from 70
  }
}
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] GitHub repository settings → Secrets has all required secrets
- [ ] SonarCloud organization created and project imported
- [ ] `.github/workflows/ci.yml` exists and is readable
- [ ] `.github/workflows/cd.yml` exists and is readable
- [ ] `sonar-project.properties` exists in root
- [ ] Package.json has `ci` and `ci:test` scripts
- [ ] Cloud Run service `valorize-api` exists in GCP
- [ ] Artifact Registry `valorize` repository exists in GCP
- [ ] Service account has correct IAM roles
- [ ] Create test PR and verify CI runs
- [ ] CI passes locally: `npm run ci`
- [ ] Workflow shows in GitHub Actions tab
- [ ] SonarCloud shows analysis results
- [ ] Merge PR to main and verify CD runs
- [ ] Cloud Run deployment succeeds
- [ ] Service is live and responding

---

## 📞 Getting Help

### Documentation
- GitHub Actions: https://docs.github.com/en/actions
- SonarCloud: https://docs.sonarcloud.io/
- Google Cloud Run: https://cloud.google.com/run/docs
- Vitest: https://vitest.dev/
- ESLint: https://eslint.org/docs

### Local Debugging
```bash
# Run CI locally before pushing
npm run ci

# Check if secrets are available locally
env | grep SONAR
env | grep GCP
```

### Check CI Logs
1. GitHub → Actions tab
2. Click failed workflow run
3. Click job (test-and-build)
4. Expand failed step
5. Read error message

---

**Last Updated**: November 2025
**Status**: ✅ Production Ready
**Maintained by**: Gabriel Fachini
