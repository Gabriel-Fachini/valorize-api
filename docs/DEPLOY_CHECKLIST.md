# Checklist de Deploy - Google Cloud Run

Use este checklist para garantir que todos os passos foram completados antes e durante o deploy.

## 📋 Pré-Deploy

### Ambiente Local
- [ ] Código está funcionando localmente
- [ ] Testes estão passando (`npm test`)
- [ ] Build está funcionando (`npm run build`)
- [ ] Sem erros de linting (`npm run lint`)
- [ ] Todas as alterações estão commitadas no Git
- [ ] Variáveis de ambiente estão documentadas

### Google Cloud Platform
- [ ] Projeto GCP criado
- [ ] Billing habilitado no projeto
- [ ] Cloud SQL PostgreSQL criado e configurado
- [ ] Banco de dados criado (`valorize_prod` ou similar)
- [ ] Usuário do banco criado com permissões adequadas
- [ ] APIs habilitadas:
  - [ ] Cloud Run API
  - [ ] Cloud SQL Admin API
  - [ ] Artifact Registry API
  - [ ] Cloud Build API (opcional)
  - [ ] Cloud Logging API
  - [ ] Cloud Monitoring API

### Ferramentas
- [ ] Docker instalado e funcionando
- [ ] Google Cloud SDK (`gcloud`) instalado
- [ ] Autenticado no GCP (`gcloud auth login`)
- [ ] Projeto configurado (`gcloud config set project PROJECT_ID`)
- [ ] Docker configurado para Artifact Registry

### Auth0
- [ ] Application configurada no Auth0
- [ ] API criada no Auth0
- [ ] Domain e Audience anotados
- [ ] Allowed Callback URLs configuradas
- [ ] Allowed Origins (CORS) configuradas

## 🏗️ Setup Inicial (Primeira vez)

### Artifact Registry
- [ ] Repositório criado no Artifact Registry
  ```bash
  gcloud artifacts repositories create valorize-api \
      --repository-format=docker \
      --location=southamerica-east1
  ```
- [ ] Docker configurado para autenticar
  ```bash
  gcloud auth configure-docker southamerica-east1-docker.pkg.dev
  ```

### Cloud SQL
- [ ] Connection name obtido
  ```bash
  gcloud sql instances describe INSTANCE_NAME --format='value(connectionName)'
  ```
- [ ] DATABASE_URL montado no formato correto
  ```
  postgresql://USER:PASS@/DB?host=/cloudsql/PROJECT:REGION:INSTANCE
  ```
- [ ] Testado conexão via Cloud SQL Proxy localmente (opcional)

## 🚀 Deploy

### Build e Push
- [ ] Dockerfile revisado
- [ ] `.dockerignore` criado
- [ ] Build local testado
  ```bash
  docker build --platform linux/amd64 -t test-image .
  ```
- [ ] Container testado localmente
  ```bash
  docker run -p 8080:8080 --env-file .env -e PORT=8080 test-image
  ```
- [ ] Build com tag de versão
  ```bash
  docker build --platform linux/amd64 \
      -t REGISTRY_URL:latest \
      -t REGISTRY_URL:vX.X.X .
  ```
- [ ] Push para Artifact Registry
  ```bash
  docker push REGISTRY_URL:latest
  docker push REGISTRY_URL:vX.X.X
  ```

### Cloud Run - Configuração
- [ ] Serviço criado no Cloud Run
- [ ] Imagem selecionada do Artifact Registry
- [ ] Região configurada (southamerica-east1)
- [ ] Port configurado (8080)
- [ ] Memory configurada (1 GiB mínimo)
- [ ] CPU configurada (1 vCPU)
- [ ] Timeout configurado (300s recomendado)
- [ ] Min instances configurado (0 para dev, 1+ para prod)
- [ ] Max instances configurado (10+)
- [ ] Autenticação configurada (Allow unauthenticated para API pública)

### Cloud Run - Variáveis de Ambiente
- [ ] `NODE_ENV=production`
- [ ] `PORT=8080`
- [ ] `HOST=0.0.0.0`
- [ ] `DATABASE_URL` (formato Cloud SQL)
- [ ] `AUTH0_DOMAIN`
- [ ] `AUTH0_AUDIENCE`
- [ ] `LOG_LEVEL=info`
- [ ] `CORS_ORIGIN` (se necessário)
- [ ] Outras variáveis específicas da aplicação

### Cloud Run - Conexões
- [ ] Cloud SQL instance conectada
- [ ] Service account configurado com permissões:
  - [ ] Cloud SQL Client
  - [ ] Artifact Registry Reader

### Deploy
- [ ] Deploy executado (Console ou CLI)
- [ ] Deploy concluído sem erros
- [ ] URL do serviço anotada

## ✅ Pós-Deploy

### Verificação Básica
- [ ] Endpoint `/health` responde 200
  ```bash
  curl https://YOUR-SERVICE-URL/health
  ```
- [ ] Swagger UI acessível em `/docs`
  ```bash
  open https://YOUR-SERVICE-URL/docs
  ```
- [ ] Logs não mostram erros críticos
  ```bash
  gcloud run services logs read valorize-api --limit=50
  ```

### Verificação de Migrations
- [ ] Logs mostram "Generating Prisma Client..."
- [ ] Logs mostram "Running database migrations..."
- [ ] Logs mostram "Database migrations completed successfully"
- [ ] Logs mostram "Starting application server..."
- [ ] Verificar no banco se migrations foram aplicadas

### Verificação de Funcionalidade
- [ ] Autenticação funcionando (teste com token Auth0)
  ```bash
  curl -H "Authorization: Bearer TOKEN" \
       https://YOUR-SERVICE-URL/users/me
  ```
- [ ] Endpoints principais respondendo corretamente
- [ ] CORS funcionando (se aplicável)
- [ ] Rate limiting funcionando

### Performance e Escalabilidade
- [ ] Cold start aceitável (< 5s)
- [ ] Response time aceitável em endpoints principais
- [ ] Scaling up funcionando (fazer vários requests simultâneos)
- [ ] Scaling down para 0 funcionando (esperar sem requisições)

### Monitoramento
- [ ] Dashboard Cloud Run verificado
- [ ] Métricas básicas OK:
  - [ ] Request count
  - [ ] Request latency
  - [ ] Error rate
  - [ ] Container instance count
  - [ ] Memory utilization
  - [ ] CPU utilization
- [ ] Cloud Logging configurado
- [ ] Alertas configurados (recomendado):
  - [ ] Error rate > 5%
  - [ ] Latency p95 > 2s
  - [ ] Memory usage > 80%

### Segurança
- [ ] HTTPS funcionando (automático no Cloud Run)
- [ ] Variáveis sensíveis não expostas nos logs
- [ ] Service account com permissões mínimas necessárias
- [ ] Cloud SQL usando IAM auth (opcional, recomendado)
- [ ] Helmet configurado (verificar headers de segurança)

## 📝 Documentação

- [ ] URL de produção documentada
- [ ] Variáveis de ambiente documentadas
- [ ] Processo de deploy documentado
- [ ] Processo de rollback documentado
- [ ] Contatos de emergência definidos
- [ ] Runbook criado para problemas comuns

## 🔄 Processo de Atualização

Para deploys futuros, verificar:

- [ ] Versão incrementada no package.json
- [ ] CHANGELOG atualizado (se existir)
- [ ] Migrations testadas localmente antes do deploy
- [ ] Backup do banco feito (para migrations destrutivas)
- [ ] Rollback plan definido
- [ ] Horário de deploy escolhido (baixo tráfego)
- [ ] Stakeholders notificados

## 🆘 Em Caso de Problema

Se algo der errado:

1. **Verificar logs imediatamente**
   ```bash
   gcloud run services logs tail valorize-api --region southamerica-east1
   ```

2. **Fazer rollback se necessário**
   ```bash
   gcloud run revisions list --service valorize-api
   gcloud run services update-traffic valorize-api --to-revisions PREVIOUS=100
   ```

3. **Verificar métricas**
   - Acessar Cloud Run Console
   - Verificar error rate, latency, instance count

4. **Problemas comuns**:
   - Container não inicia → Verificar logs de startup
   - Database connection failed → Verificar DATABASE_URL e Cloud SQL connection
   - Out of memory → Aumentar memória alocada
   - Timeout → Aumentar timeout ou otimizar código

## 📞 Contatos

- **GCP Support**: [console.cloud.google.com/support](https://console.cloud.google.com/support)
- **Time Dev**: [definir contato]
- **DBA**: [definir contato]
- **DevOps**: [definir contato]

---

**Última atualização**: $(date +%Y-%m-%d)

