# 🚀 Deploy no Google Cloud Run - Início Rápido

Este guia oferece um caminho rápido para fazer deploy da API Valorize no Google Cloud Run.

## ✅ Pré-requisitos

Antes de começar, certifique-se de ter:

- ✅ Projeto GCP criado
- ✅ Cloud SQL PostgreSQL configurado
- ✅ Docker instalado
- ✅ Google Cloud SDK (`gcloud`) instalado e autenticado
- ✅ Arquivo `.env` funcionando localmente

## 🎯 Opção 1: Deploy Manual via Console (Recomendado para iniciantes)

### Passo a Passo Completo

Siga o guia detalhado em: **[docs/GCP_CLOUD_RUN_DEPLOYMENT.md](docs/GCP_CLOUD_RUN_DEPLOYMENT.md)**

Este guia inclui:
- Screenshots e instruções detalhadas
- Como configurar via interface web do Google Cloud
- Configuração de variáveis de ambiente
- Conexão com Cloud SQL
- Verificação pós-deploy

### Resumo dos Passos

1. **Criar repositório no Artifact Registry**
2. **Build e push da imagem Docker**
3. **Criar serviço no Cloud Run via Console**
4. **Configurar variáveis de ambiente**
5. **Conectar ao Cloud SQL**
6. **Deploy e verificação**

## ⚡ Opção 2: Deploy Rápido via CLI

### Setup Inicial (uma vez)

```bash
# 1. Configure o projeto
export GCP_PROJECT_ID=seu-project-id
gcloud config set project $GCP_PROJECT_ID

# 2. Autentique o Docker
gcloud auth configure-docker southamerica-east1-docker.pkg.dev

# 3. Crie o repositório
gcloud artifacts repositories create valorize-api \
    --repository-format=docker \
    --location=southamerica-east1
```

### Deploy

```bash
# 1. Build da imagem (IMPORTANTE: --platform linux/amd64)
docker build --platform linux/amd64 \
    -t southamerica-east1-docker.pkg.dev/$GCP_PROJECT_ID/valorize-api/api:v1.0.0 .

# 2. Push para Artifact Registry
docker push southamerica-east1-docker.pkg.dev/$GCP_PROJECT_ID/valorize-api/api:v1.0.0

# 3. Deploy no Cloud Run (substitua CONNECTION_NAME e variáveis)
gcloud run deploy valorize-api \
    --image southamerica-east1-docker.pkg.dev/$GCP_PROJECT_ID/valorize-api/api:v1.0.0 \
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
    --set-env-vars DATABASE_URL="postgresql://user:pass@/db?host=/cloudsql/CONNECTION_NAME"
```

## 🤖 Opção 3: Script Automatizado

Use o script helper incluído:

```bash
# Configure o project ID
export GCP_PROJECT_ID=seu-project-id

# Execute o script
./scripts/deploy-gcp.sh v1.0.0
```

O script irá:
1. ✅ Build da imagem Docker
2. ✅ Push para Artifact Registry
3. ✅ Deploy no Cloud Run
4. ✅ Mostrar URL do serviço

## 📝 Variáveis de Ambiente Necessárias

Configure no Cloud Run:

```bash
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# Database (formato especial para Cloud SQL)
DATABASE_URL=postgresql://USER:PASS@/DB?host=/cloudsql/PROJECT:REGION:INSTANCE

# Auth0
AUTH0_DOMAIN=seu-tenant.auth0.com
AUTH0_AUDIENCE=https://sua-api-identifier

# Opcional
CORS_ORIGIN=https://seu-frontend.com
LOG_LEVEL=info
```

### 🔍 Como obter o CONNECTION_NAME do Cloud SQL:

```bash
gcloud sql instances describe INSTANCE_NAME --format='value(connectionName)'
```

## 🧪 Verificação Pós-Deploy

Após o deploy, teste:

```bash
# 1. Health check
curl https://SEU-SERVICE-URL/health

# 2. Swagger UI
open https://SEU-SERVICE-URL/docs

# 3. Ver logs
gcloud run services logs tail valorize-api --region southamerica-east1
```

## 📚 Documentação Completa

### Guias Principais
- **[Deploy Guide](docs/GCP_CLOUD_RUN_DEPLOYMENT.md)** - Guia completo passo a passo
- **[Quick Reference](docs/DEPLOY_QUICK_REFERENCE.md)** - Comandos essenciais
- **[Checklist](docs/DEPLOY_CHECKLIST.md)** - Checklist pré/pós-deploy
- **[Troubleshooting](docs/TROUBLESHOOTING_CLOUD_RUN.md)** - Solução de problemas

### Recursos Incluídos

#### Arquivos Docker
- ✅ `Dockerfile` - Multi-stage build otimizado
- ✅ `.dockerignore` - Exclusões de build
- ✅ `.gcloudignore` - Exclusões de upload

#### Scripts
- ✅ `scripts/docker-entrypoint.sh` - Startup com migrations
- ✅ `scripts/deploy-gcp.sh` - Deploy automatizado

#### Documentação
- ✅ Guia completo de deploy
- ✅ Referência rápida de comandos
- ✅ Checklist de verificação
- ✅ Guia de troubleshooting
- ✅ Exemplo de Cloud Build (CI/CD futuro)

## ⚠️ Pontos Importantes

### 1. Plataforma da Imagem Docker
**SEMPRE** use `--platform linux/amd64` ao fazer build:

```bash
docker build --platform linux/amd64 ...
```

Isso é **essencial** se você estiver em Mac M1/M2/M3, pois o Cloud Run roda em arquitetura AMD64.

### 2. Formato do DATABASE_URL
Para Cloud Run, use o formato Unix socket:

```
postgresql://user:pass@/database?host=/cloudsql/PROJECT:REGION:INSTANCE
```

**NÃO** use `localhost` ou IP.

### 3. Port e Host
A aplicação **deve** escutar em:
- Port: `process.env.PORT` (Cloud Run define como 8080)
- Host: `0.0.0.0` (não `localhost` ou `127.0.0.1`)

### 4. Migrations
As migrations rodam automaticamente no startup via `docker-entrypoint.sh`. Se falharem, o container não inicia.

## 🆘 Problemas Comuns

### Container não inicia
```bash
# Ver logs
gcloud run services logs read valorize-api --limit 100
```

Causas comuns:
- Erro nas migrations → Verificar DATABASE_URL
- Porta incorreta → Verificar se usa process.env.PORT
- Host incorreto → Usar 0.0.0.0, não localhost

### Conexão com banco falha
Verifique:
1. Cloud SQL connection está configurada no Cloud Run
2. DATABASE_URL está no formato correto
3. Service account tem permissão `Cloud SQL Client`

### Ver guia completo
Consulte: **[docs/TROUBLESHOOTING_CLOUD_RUN.md](docs/TROUBLESHOOTING_CLOUD_RUN.md)**

## 🎓 Próximos Passos

Após o primeiro deploy:

1. ✅ Configure domínio customizado (se necessário)
2. ✅ Configure alertas de monitoramento
3. ✅ Configure backup automático do banco
4. ✅ Implemente CI/CD com Cloud Build (opcional)
5. ✅ Configure Secret Manager para dados sensíveis

## 💡 Dicas

- **Desenvolvimento**: Use `min-instances=0` para economizar
- **Produção**: Use `min-instances=1+` para evitar cold start
- **Teste local**: Sempre teste a imagem Docker localmente antes do push
- **Versionamento**: Use tags de versão além de `latest`
- **Rollback**: Mantenha revisões antigas para rollback rápido

## 📞 Suporte

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [GCP Support](https://console.cloud.google.com/support)

---

**Ready to deploy? Start with the [Complete Deployment Guide](docs/GCP_CLOUD_RUN_DEPLOYMENT.md)! 🚀**

