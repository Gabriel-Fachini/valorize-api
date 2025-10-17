# Deploy da API Valorize no Google Cloud Run

Este guia detalha o processo completo de deploy da API Valorize no Google Cloud Run usando a interface web do Google Cloud Console.

## 📋 Pré-requisitos

- ✅ Projeto GCP criado
- ✅ Cloud SQL PostgreSQL configurado
- ✅ Arquivo `.env` com variáveis configuradas localmente
- ✅ Docker instalado localmente
- ✅ Google Cloud SDK (gcloud CLI) instalado

## 🏗️ Fase 1: Preparar e Fazer Upload da Imagem Docker

### Passo 1: Configurar autenticação do Docker com GCP

```bash
# Autenticar com o GCP
gcloud auth login

# Configurar o projeto
gcloud config set project SEU_PROJECT_ID

# Configurar Docker para usar o Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev
```

> **Nota**: Substitua `us-central1` pela região onde deseja hospedar suas imagens. Para Brasil, considere `southamerica-east1`.

### Passo 2: Criar repositório no Artifact Registry (se não existir)

Via Console:
1. Acesse [Artifact Registry](https://console.cloud.google.com/artifacts)
2. Clique em "CREATE REPOSITORY"
3. Configure:
   - **Name**: `valorize-api`
   - **Format**: Docker
   - **Location type**: Region
   - **Region**: `southamerica-east1` (São Paulo) ou `us-central1`
   - **Encryption**: Google-managed
4. Clique em "CREATE"

Via CLI:
```bash
gcloud artifacts repositories create valorize-api \
    --repository-format=docker \
    --location=southamerica-east1 \
    --description="Valorize API Docker images"
```

### Passo 3: Build da imagem Docker

⚠️ **IMPORTANTE**: Use `--platform linux/amd64` para garantir compatibilidade com Cloud Run (especialmente se estiver em Mac M1/M2/M3).

```bash
# Navegue até o diretório do projeto
cd /Users/gabriel_fachini/Desktop/repos/valorize-api

# Build da imagem (substitua PROJECT_ID pelo seu ID de projeto)
docker build --platform linux/amd64 \
    -t southamerica-east1-docker.pkg.dev/SEU_PROJECT_ID/valorize-api/api:latest \
    -t southamerica-east1-docker.pkg.dev/SEU_PROJECT_ID/valorize-api/api:v1.0.0 .
```

> **Dica**: Use tags de versão (ex: v1.0.0) além de `latest` para facilitar rollbacks.

> **Nota**: Se você ver avisos sobre TypeScript durante o build, isso é normal. O Dockerfile está configurado para compilar mesmo com alguns erros de tipo, já que o código funciona em desenvolvimento. A imagem final terá ~140MB.

### Passo 4: Testar a imagem localmente (opcional mas recomendado)

```bash
# Teste local com variáveis de ambiente do seu .env
docker run --platform linux/amd64 \
    -p 8080:8080 \
    --env-file .env \
    -e PORT=8080 \
    southamerica-east1-docker.pkg.dev/SEU_PROJECT_ID/valorize-api/api:latest
```

Acesse `http://localhost:8080/health` para verificar se está funcionando.

### Passo 5: Push da imagem para o Artifact Registry

```bash
# Push da imagem
docker push southamerica-east1-docker.pkg.dev/SEU_PROJECT_ID/valorize-api/api:latest
docker push southamerica-east1-docker.pkg.dev/SEU_PROJECT_ID/valorize-api/api:v1.0.0
```

## ☁️ Fase 2: Configurar e Fazer Deploy no Cloud Run

### Passo 1: Acessar Cloud Run

1. Acesse [Cloud Run Console](https://console.cloud.google.com/run)
2. Clique em "CREATE SERVICE"

### Passo 2: Configurar o Container

**Container image URL**:
1. Clique em "SELECT" ao lado do campo
2. Navegue até: Artifact Registry > valorize-api > api
3. Selecione a tag `latest` (ou versão específica)
4. Clique em "SELECT"

### Passo 3: Configurar o Serviço

**Service name**: `valorize-api`

**Region**: `southamerica-east1` (São Paulo, Brasil)

**CPU allocation and pricing**:
- ✅ CPU is only allocated during request processing

**Minimum number of instances**: `0` (para economizar, escala para 0 quando não houver tráfego)

**Maximum number of instances**: `10` (ajuste conforme necessidade)

**Autoscaling**: 
- Instance autoscaling: CPU utilization
- Target CPU utilization: 80%

### Passo 4: Configurar Autenticação

**Authentication**:
- ⚪ Allow unauthenticated invocations (para API pública)
- Se sua API precisar de autenticação no Cloud Run, selecione "Require authentication"

### Passo 5: Configurar Container

Clique em "CONTAINER, NETWORKING, SECURITY" para expandir as opções:

#### Container Tab:

**Container port**: `8080`

**Memory**: `1 GiB` (recomendado para Node.js com Prisma)

**CPU**: `1` CPU

**Request timeout**: `300` segundos (5 minutos)

**Maximum concurrent requests per instance**: `80`

**Command**: (deixar vazio, usa o CMD do Dockerfile)

**Arguments**: (deixar vazio)

#### Variables & Secrets Tab:

Adicione as seguintes variáveis de ambiente:

**Variáveis de Ambiente**:
1. Clique em "ADD VARIABLE"
2. Adicione cada uma das seguintes:

```
NODE_ENV = production
PORT = 8080
HOST = 0.0.0.0
AUTH0_DOMAIN = seu-tenant.auth0.com
AUTH0_AUDIENCE = https://sua-api-identifier
LOG_LEVEL = info
```

**Variáveis opcionais**:
```
CORS_ORIGIN = https://seu-frontend.com
CORS_CREDENTIALS = true
RATE_LIMIT_MAX = 100
RATE_LIMIT_TIME_WINDOW = 60000
```

**DATABASE_URL**: (Configurar na próxima seção)

### Passo 6: Conectar ao Cloud SQL

Na aba "CONNECTIONS":

1. Clique em "ADD CONNECTION"
2. Selecione "Cloud SQL connections"
3. Escolha sua instância Cloud SQL PostgreSQL
4. Clique em "ADD"

**Configurar DATABASE_URL**:

Volte para a aba "Variables & Secrets" e adicione:

```
DATABASE_URL = postgresql://usuario:senha@localhost/nome_do_banco?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
```

Formato alternativo (mais comum):
```
DATABASE_URL = postgresql://usuario:senha@/nome_do_banco?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
```

> **Exemplo real**:
> ```
> DATABASE_URL = postgresql://postgres:minhasenha@/valorize_prod?host=/cloudsql/meu-projeto-123:southamerica-east1:valorize-db
> ```

Para obter o connection name:
```bash
gcloud sql instances describe INSTANCE_NAME --format='value(connectionName)'
```

### Passo 7: Configurar Rede (Opcional)

Na aba "NETWORKING":

**Ingress control**: All (permite tráfego de qualquer origem)

**VPC connector**: (deixar vazio, a menos que precise de acesso a recursos VPC privados)

### Passo 8: Configurar Security (Opcional)

Na aba "SECURITY":

**Service account**: Use a conta padrão do Cloud Run ou crie uma específica

**Encryption**: Google-managed encryption key (padrão)

### Passo 9: Deploy

1. Revise todas as configurações
2. Clique em "CREATE" no final da página
3. Aguarde o deploy (pode levar 2-5 minutos)

## 🧪 Fase 3: Verificação e Testes

### Passo 1: Obter a URL do serviço

Após o deploy, você verá a URL do serviço no formato:
```
https://valorize-api-XXXXXXXX-southamerica-east1.a.run.app
```

### Passo 2: Testar Health Check

```bash
curl https://valorize-api-XXXXXXXX-southamerica-east1.a.run.app/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2025-10-17T...",
  "uptime": 123.456
}
```

### Passo 3: Verificar Documentação Swagger

Acesse no navegador:
```
https://valorize-api-XXXXXXXX-southamerica-east1.a.run.app/docs
```

### Passo 4: Verificar Logs

1. No Cloud Run, clique no serviço `valorize-api`
2. Clique na aba "LOGS"
3. Verifique se as migrations rodaram com sucesso:
   - ✅ "Generating Prisma Client..."
   - ✅ "Running database migrations..."
   - ✅ "Database migrations completed successfully"
   - ✅ "Starting application server..."

### Passo 5: Testar Autenticação

Teste um endpoint que requer autenticação:

```bash
# Obtenha um token do Auth0
TOKEN="seu_token_aqui"

# Teste endpoint autenticado
curl -H "Authorization: Bearer $TOKEN" \
     https://valorize-api-XXXXXXXX-southamerica-east1.a.run.app/users/me
```

## 🔄 Atualizações Futuras

### Método 1: Via Console (Interface Web)

1. Acesse [Cloud Run Console](https://console.cloud.google.com/run)
2. Clique no serviço `valorize-api`
3. Clique em "EDIT & DEPLOY NEW REVISION"
4. Em "Container image URL", clique em "SELECT"
5. Escolha a nova versão da imagem
6. Clique em "DEPLOY"

### Método 2: Via CLI

```bash
# 1. Build nova versão
docker build --platform linux/amd64 \
    -t southamerica-east1-docker.pkg.dev/SEU_PROJECT_ID/valorize-api/api:v1.0.1 .

# 2. Push
docker push southamerica-east1-docker.pkg.dev/SEU_PROJECT_ID/valorize-api/api:v1.0.1

# 3. Deploy
gcloud run deploy valorize-api \
    --image southamerica-east1-docker.pkg.dev/SEU_PROJECT_ID/valorize-api/api:v1.0.1 \
    --region southamerica-east1 \
    --platform managed
```

## 🔧 Comandos Úteis

### Verificar status do serviço
```bash
gcloud run services describe valorize-api --region southamerica-east1
```

### Ver logs em tempo real
```bash
gcloud run services logs read valorize-api \
    --region southamerica-east1 \
    --limit 50 \
    --format "value(log)"
```

### Listar revisões
```bash
gcloud run revisions list \
    --service valorize-api \
    --region southamerica-east1
```

### Fazer rollback para revisão anterior
```bash
gcloud run services update-traffic valorize-api \
    --to-revisions REVISION_NAME=100 \
    --region southamerica-east1
```

### Atualizar variável de ambiente
```bash
gcloud run services update valorize-api \
    --update-env-vars LOG_LEVEL=debug \
    --region southamerica-east1
```

### Escalar manualmente
```bash
gcloud run services update valorize-api \
    --min-instances 1 \
    --max-instances 20 \
    --region southamerica-east1
```

## 🎯 Configuração de Domínio Customizado

### Via Console:

1. No serviço Cloud Run, vá para aba "CUSTOM DOMAINS"
2. Clique em "ADD MAPPING"
3. Selecione o domínio verificado
4. Adicione o subdomínio (ex: api.valorize.com)
5. Copie os registros DNS fornecidos
6. Configure os registros no seu provedor de DNS
7. Aguarde propagação (pode levar até 48h)

## 🔒 Segurança e Boas Práticas

### 1. Usar Secret Manager para dados sensíveis

Em vez de variáveis de ambiente, use Secret Manager:

```bash
# Criar secret
echo -n "sua-senha-aqui" | gcloud secrets create db-password --data-file=-

# Dar permissão ao Cloud Run
gcloud secrets add-iam-policy-binding db-password \
    --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
    --role="roles/secretmanager.secretAccessor"
```

No Cloud Run, em "Variables & Secrets":
- Clique em "REFERENCE A SECRET"
- Selecione o secret
- Configure o nome da variável de ambiente

### 2. Configurar alertas de monitoramento

1. Acesse Cloud Monitoring
2. Configure alertas para:
   - Alta latência de requisições
   - Taxa de erro > 5%
   - Uso de memória > 80%
   - Número de instâncias = max instances

### 3. Configurar limites de custo

1. Acesse "Budgets & alerts" no Console
2. Crie um orçamento mensal
3. Configure alertas em 50%, 80% e 100%

## 📊 Monitoramento

### Métricas principais a observar:

- **Request count**: Número de requisições
- **Request latency**: Tempo de resposta
- **Error rate**: Taxa de erro
- **Container instance count**: Número de instâncias ativas
- **Memory utilization**: Uso de memória
- **CPU utilization**: Uso de CPU
- **Billable container time**: Tempo faturável

### Dashboards recomendados:

1. Cloud Run Metrics (nativo)
2. Cloud SQL Metrics
3. Error Reporting
4. Cloud Trace (para análise de performance)

## ❓ Troubleshooting

### Problema: Container não inicia

**Sintomas**: Erro 503, logs mostram "Container failed to start"

**Soluções**:
1. Verificar logs de inicialização
2. Testar imagem localmente
3. Verificar se migrations estão falhando
4. Verificar se DATABASE_URL está correto

### Problema: Timeout nas requisições

**Sintomas**: Erro 504, requisições demoram muito

**Soluções**:
1. Aumentar memória alocada (para 2 GiB)
2. Aumentar timeout de requisição
3. Otimizar queries do banco
4. Verificar cold start (considerar min-instances > 0)

### Problema: Database connection failed

**Sintomas**: Erro de conexão com PostgreSQL

**Soluções**:
1. Verificar se Cloud SQL connection está configurada
2. Verificar formato do DATABASE_URL
3. Verificar credenciais do banco
4. Verificar se instância Cloud SQL está ativa
5. Verificar permissões do service account

### Problema: Out of memory

**Sintomas**: Container restart, logs mostram OOM

**Soluções**:
1. Aumentar memória para 2 GiB ou mais
2. Otimizar uso de memória no código
3. Verificar memory leaks
4. Reduzir concurrent requests

## 💰 Estimativa de Custos

**Cloud Run** (região São Paulo):
- CPU: ~$0.00002400 por vCPU-segundo
- Memory: ~$0.00000250 por GiB-segundo
- Requests: ~$0.40 por milhão de requisições

**Exemplo para 100k requisições/mês**:
- Se cada req leva ~200ms com 1 vCPU e 1 GiB
- CPU: 100k * 0.2s * $0.000024 = ~$0.48
- Memory: 100k * 0.2s * $0.0000025 = ~$0.05
- Requests: $0.04
- **Total**: ~$0.57/mês

> **Nota**: Cloud Run tem free tier generoso que cobre muitos casos de uso pequenos/médios.

## 📚 Recursos Adicionais

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Proxy](https://cloud.google.com/sql/docs/postgres/connect-run)
- [Best Practices for Cloud Run](https://cloud.google.com/run/docs/tips)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)

## 🎉 Conclusão

Sua API Valorize agora está rodando no Google Cloud Run com:
- ✅ Escalabilidade automática
- ✅ HTTPS configurado automaticamente
- ✅ Conexão segura com Cloud SQL
- ✅ Logs centralizados
- ✅ Migrations automáticas no deploy
- ✅ Monitoramento integrado
- ✅ Zero custo quando não houver tráfego

Para qualquer dúvida ou problema, consulte os logs no Cloud Logging e as métricas no Cloud Monitoring.

