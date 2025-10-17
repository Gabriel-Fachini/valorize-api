# GCP Cloud Run - Referência Rápida de Comandos

Guia rápido com os comandos essenciais para deploy no Google Cloud Run.

## 🔧 Setup Inicial (Uma vez)

```bash
# Login no GCP
gcloud auth login

# Configurar projeto
gcloud config set project SEU_PROJECT_ID

# Configurar Docker para Artifact Registry
gcloud auth configure-docker southamerica-east1-docker.pkg.dev

# Criar repositório no Artifact Registry
gcloud artifacts repositories create valorize-api \
    --repository-format=docker \
    --location=southamerica-east1 \
    --description="Valorize API Docker images"
```

## 🚀 Deploy (Primeira vez ou atualização)

### 1. Build da Imagem

```bash
# Substitua SEU_PROJECT_ID pelo ID do seu projeto GCP
export PROJECT_ID=SEU_PROJECT_ID
export VERSION=v1.0.0

# Build (IMPORTANTE: --platform linux/amd64 para compatibilidade)
docker build --platform linux/amd64 \
    -t southamerica-east1-docker.pkg.dev/$PROJECT_ID/valorize-api/api:latest \
    -t southamerica-east1-docker.pkg.dev/$PROJECT_ID/valorize-api/api:$VERSION .
```

### 2. Teste Local (Opcional)

```bash
# Testar a imagem localmente
docker run --platform linux/amd64 \
    -p 8080:8080 \
    --env-file .env \
    -e PORT=8080 \
    southamerica-east1-docker.pkg.dev/$PROJECT_ID/valorize-api/api:latest

# Em outro terminal, testar
curl http://localhost:8080/health
```

### 3. Push da Imagem

```bash
# Upload para Artifact Registry
docker push southamerica-east1-docker.pkg.dev/$PROJECT_ID/valorize-api/api:latest
docker push southamerica-east1-docker.pkg.dev/$PROJECT_ID/valorize-api/api:$VERSION
```

### 4. Deploy no Cloud Run (via CLI - alternativa ao Console)

```bash
# Obter connection name do Cloud SQL
gcloud sql instances describe NOME_DA_INSTANCIA --format='value(connectionName)'

# Deploy
gcloud run deploy valorize-api \
    --image southamerica-east1-docker.pkg.dev/$PROJECT_ID/valorize-api/api:latest \
    --region southamerica-east1 \
    --platform managed \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 0 \
    --port 8080 \
    --add-cloudsql-instances CONNECTION_NAME \
    --set-env-vars NODE_ENV=production,PORT=8080,HOST=0.0.0.0 \
    --set-env-vars AUTH0_DOMAIN=seu-tenant.auth0.com \
    --set-env-vars AUTH0_AUDIENCE=https://sua-api \
    --set-env-vars DATABASE_URL="postgresql://user:pass@/dbname?host=/cloudsql/CONNECTION_NAME"
```

## 🔄 Atualizar Deploy Existente

```bash
# Build nova versão
export VERSION=v1.0.1
docker build --platform linux/amd64 \
    -t southamerica-east1-docker.pkg.dev/$PROJECT_ID/valorize-api/api:$VERSION .

# Push
docker push southamerica-east1-docker.pkg.dev/$PROJECT_ID/valorize-api/api:$VERSION

# Deploy nova versão
gcloud run deploy valorize-api \
    --image southamerica-east1-docker.pkg.dev/$PROJECT_ID/valorize-api/api:$VERSION \
    --region southamerica-east1
```

## 📊 Monitoramento e Debug

```bash
# Ver logs em tempo real
gcloud run services logs read valorize-api \
    --region southamerica-east1 \
    --limit 50

# Ver logs formatados
gcloud run services logs read valorize-api \
    --region southamerica-east1 \
    --format "value(log)" \
    --limit 100

# Seguir logs (tail)
gcloud run services logs tail valorize-api \
    --region southamerica-east1

# Descrever serviço
gcloud run services describe valorize-api \
    --region southamerica-east1

# Listar revisões
gcloud run revisions list \
    --service valorize-api \
    --region southamerica-east1

# Ver URL do serviço
gcloud run services describe valorize-api \
    --region southamerica-east1 \
    --format 'value(status.url)'
```

## 🔧 Atualizar Configurações

```bash
# Atualizar variável de ambiente
gcloud run services update valorize-api \
    --update-env-vars LOG_LEVEL=debug \
    --region southamerica-east1

# Atualizar memória
gcloud run services update valorize-api \
    --memory 2Gi \
    --region southamerica-east1

# Atualizar escalabilidade
gcloud run services update valorize-api \
    --min-instances 1 \
    --max-instances 20 \
    --region southamerica-east1

# Atualizar timeout
gcloud run services update valorize-api \
    --timeout 600 \
    --region southamerica-east1
```

## ⏮️ Rollback

```bash
# Listar revisões
gcloud run revisions list \
    --service valorize-api \
    --region southamerica-east1

# Fazer rollback para revisão específica
gcloud run services update-traffic valorize-api \
    --to-revisions NOME_DA_REVISAO=100 \
    --region southamerica-east1

# Ou usar tag
gcloud run services update-traffic valorize-api \
    --to-tags NOME_DA_TAG=100 \
    --region southamerica-east1
```

## 🧹 Limpeza

```bash
# Deletar serviço
gcloud run services delete valorize-api \
    --region southamerica-east1

# Deletar revisões antigas (mantém apenas as 3 mais recentes)
gcloud run revisions list \
    --service valorize-api \
    --region southamerica-east1 \
    --format="value(name)" \
    --sort-by="~metadata.creationTimestamp" \
    --limit=100 | tail -n +4 | xargs -I {} gcloud run revisions delete {} --region southamerica-east1 --quiet

# Deletar imagens antigas do Artifact Registry
gcloud artifacts docker images delete \
    southamerica-east1-docker.pkg.dev/$PROJECT_ID/valorize-api/api:OLD_VERSION
```

## 🧪 Testes Rápidos

```bash
# Health check
curl https://valorize-api-XXXXX-southamerica-east1.a.run.app/health

# Swagger docs
curl https://valorize-api-XXXXX-southamerica-east1.a.run.app/docs

# Com autenticação
export TOKEN="seu_token_auth0"
curl -H "Authorization: Bearer $TOKEN" \
     https://valorize-api-XXXXX-southamerica-east1.a.run.app/users/me
```

## 🔐 Cloud SQL Connection String

### Formato para Cloud Run (usando Unix socket):

```bash
# Pattern
postgresql://USER:PASSWORD@/DATABASE?host=/cloudsql/PROJECT:REGION:INSTANCE

# Exemplo
postgresql://postgres:minhasenha@/valorize_prod?host=/cloudsql/meu-projeto-123:southamerica-east1:valorize-db
```

### Obter Connection Name:

```bash
gcloud sql instances describe INSTANCE_NAME \
    --format='value(connectionName)'
```

## 💡 Dicas

1. **Sempre use versões**: Além de `latest`, use tags de versão (`v1.0.0`, `v1.0.1`, etc.)
2. **Teste localmente**: Sempre teste a imagem Docker localmente antes do deploy
3. **Monitore logs**: Use `gcloud run services logs tail` durante o deploy
4. **Gradual rollout**: Use traffic splitting para deploys graduais
5. **Backups**: Sempre faça backup do banco antes de migrations grandes

## 📝 Variáveis de Ambiente Essenciais

```bash
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
DATABASE_URL=postgresql://...
AUTH0_DOMAIN=seu-tenant.auth0.com
AUTH0_AUDIENCE=https://sua-api
LOG_LEVEL=info
CORS_ORIGIN=https://seu-frontend.com
```

## 🆘 Troubleshooting Rápido

### Problema: Container não inicia
```bash
# Ver logs detalhados
gcloud run services logs read valorize-api --limit=100 --region southamerica-east1
```

### Problema: Conexão com banco falha
```bash
# Verificar connection name
gcloud sql instances describe INSTANCE --format='value(connectionName)'

# Testar conexão local via proxy
cloud_sql_proxy -instances=PROJECT:REGION:INSTANCE=tcp:5432
```

### Problema: Out of memory
```bash
# Aumentar memória
gcloud run services update valorize-api --memory 2Gi --region southamerica-east1
```

## 🔗 Links Úteis

- [Console Cloud Run](https://console.cloud.google.com/run)
- [Artifact Registry](https://console.cloud.google.com/artifacts)
- [Cloud SQL](https://console.cloud.google.com/sql)
- [Cloud Logging](https://console.cloud.google.com/logs)
- [Documentação detalhada](./GCP_CLOUD_RUN_DEPLOYMENT.md)

