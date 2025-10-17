# Troubleshooting - Cloud Run

Guia de resolução de problemas comuns ao fazer deploy no Google Cloud Run.

## 🔍 Como Investigar Problemas

### 1. Sempre comece pelos logs

```bash
# Logs em tempo real
gcloud run services logs tail valorize-api --region southamerica-east1

# Últimos 100 logs
gcloud run services logs read valorize-api --limit 100 --region southamerica-east1

# Filtrar por erro
gcloud run services logs read valorize-api --region southamerica-east1 | grep -i error

# Logs formatados
gcloud run services logs read valorize-api \
    --region southamerica-east1 \
    --format "table(timestamp, log)"
```

### 2. Verificar métricas

```bash
# Descrever serviço
gcloud run services describe valorize-api --region southamerica-east1

# Ver URL e status
gcloud run services describe valorize-api \
    --region southamerica-east1 \
    --format="value(status.url, status.conditions)"
```

### 3. Acessar Cloud Console

- [Cloud Run Console](https://console.cloud.google.com/run)
- [Cloud Logging](https://console.cloud.google.com/logs)
- [Error Reporting](https://console.cloud.google.com/errors)

---

## ❌ Erro: Container failed to start

### Sintomas
- Status: Error / Revision failed
- HTTP 503 Service Unavailable
- Logs: "Container failed to start. Failed to start and then listen on the port defined by the PORT environment variable."

### Causas Possíveis

#### 1. Aplicação não está escutando na porta correta

**Problema**: Cloud Run espera que a aplicação escute na porta definida por `PORT` (padrão 8080).

**Solução**:
```typescript
// src/app.ts - Verificar se usa process.env.PORT
const port = parseInt(process.env.PORT ?? '3000')
const host = process.env.HOST ?? '0.0.0.0'

await app.listen({ port, host })
```

#### 2. Aplicação não está escutando em 0.0.0.0

**Problema**: Se escutar apenas em localhost/127.0.0.1, Cloud Run não consegue conectar.

**Solução**: Sempre usar `0.0.0.0`
```typescript
await app.listen({ port, host: '0.0.0.0' })
```

#### 3. Migrations falhando no startup

**Problema**: Migrations falham e o container não inicia.

**Diagnóstico**: Verificar logs de startup:
```bash
gcloud run services logs read valorize-api --limit 200 | grep -A 5 "Running database migrations"
```

**Soluções**:
- Verificar se DATABASE_URL está correto
- Verificar se Cloud SQL connection está configurada
- Testar migrations localmente primeiro
- Verificar se há migrations pendentes conflitantes

#### 4. Erro no build do Docker

**Problema**: Imagem Docker tem problemas.

**Erro comum**: `failed to build: process "npx prisma generate" did not complete successfully`

**Causa**: Prisma precisa de DATABASE_URL definida mesmo durante o build (como placeholder).

**Solução**: O Dockerfile já inclui um DATABASE_URL placeholder. Se o erro persistir, verifique se o schema.prisma está correto.

**Testar localmente**:
```bash
docker build --platform linux/amd64 -t test-image .
docker run -p 8080:8080 -e PORT=8080 --env-file .env test-image
```

---

## 🗄️ Erro: Database Connection Failed

### Sintomas
- Logs: "Can't reach database server"
- Logs: "Connection refused"
- Logs: "ECONNREFUSED"
- Logs: "P1000: Authentication failed"
- Logs: "P1013: The provided database string is invalid"
- Endpoints retornam 500

### Causas e Soluções

#### 1. Cloud SQL Connection não configurada

**Verificar**: Na aba "Connections" do Cloud Run, deve ter a instância Cloud SQL.

**Solução**:
1. Edit & Deploy New Revision
2. Aba "Connections"
3. Add Connection → Cloud SQL
4. Selecionar instância

#### 2. DATABASE_URL incorreto

**⚠️ MUITO IMPORTANTE**: O formato para Cloud Run é DIFERENTE do formato local!

**Formato CORRETO para Cloud Run com Cloud SQL Proxy**:
```bash
postgresql://USER:PASSWORD@localhost/DATABASE?host=/cloudsql/PROJECT:REGION:INSTANCE
```

**✅ Exemplo CORRETO**:
```bash
postgresql://postgres:MinhaSenh@123@localhost/valorize?host=/cloudsql/valorize-475221:southamerica-east1:valorize-dev
```

**❌ ERROS COMUNS**:

**Erro 1: Falta o "localhost"**
```bash
# ❌ ERRADO - vai dar erro P1013 "empty host"
postgresql://postgres:senha@/valorize?host=/cloudsql/...
```
```
Error: P1013: The provided database string is invalid. empty host in database URL.
```

**Erro 2: Usar IP público**
```bash
# ❌ ERRADO - não vai conectar via Cloud SQL Proxy
postgresql://postgres:senha@34.39.195.206:5432/valorize
```
```
Error: P1001: Can't reach database server at `34.39.195.206:5432`
```

**Erro 3: Usar IP privado sem Proxy**
```bash
# ❌ ERRADO - Cloud Run não tem acesso direto à rede privada
postgresql://postgres:senha@10.10.10.5:5432/valorize
```

**Obter connection name**:
```bash
gcloud sql instances describe INSTANCE_NAME --format='value(connectionName)'
# Exemplo de output: valorize-475221:southamerica-east1:valorize-dev
```

#### 3. Erro P1000: Authentication Failed - Problema com Senha

**Sintoma específico**:
```
Error: P1000: Authentication failed against database server, the provided database credentials for `postgres` are not valid.
```

**Causa mais comum**: Caracteres especiais na senha não estão codificados corretamente!

**⚠️ PROBLEMA CRÍTICO COM CARACTERES ESPECIAIS**

Se sua senha contém caracteres especiais como `[]<>&=@#$%^*()`, você DEVE fazer URL encoding.

**Exemplo Real - Caso de Erro:**

Senha original: `1J[>y2rUKzq6Hz9&=`

❌ **ERRADO** (vai falhar autenticação):
```bash
postgresql://postgres:1J[>y2rUKzq6Hz9&=@localhost/valorize?host=/cloudsql/...
```

✅ **CORRETO** (com URL encoding):
```bash
postgresql://postgres:1J%5B%3Ey2rUKzq6Hz9%26%3D@localhost/valorize?host=/cloudsql/...
```

**Tabela de Encoding para Caracteres Especiais Comuns:**

| Caractere | URL Encoded | Exemplo             |
|-----------|-------------|---------------------|
| `[`       | `%5B`       | senha[123 → senha%5B123 |
| `]`       | `%5D`       | senha]123 → senha%5D123 |
| `<`       | `%3C`       | senha<123 → senha%3C123 |
| `>`       | `%3E`       | senha>123 → senha%3E123 |
| `&`       | `%26`       | senha&123 → senha%26123 |
| `=`       | `%3D`       | senha=123 → senha%3D123 |
| `@`       | `%40`       | senha@123 → senha%40123 |
| `#`       | `%23`       | senha#123 → senha%23123 |
| `%`       | `%25`       | senha%123 → senha%25123 |
| `+`       | `%2B`       | senha+123 → senha%2B123 |
| ` ` (espaço) | `%20`    | senha 123 → senha%20123 |

**💡 SOLUÇÃO MAIS SIMPLES - RECOMENDADA:**

**Ao invés de fazer URL encoding complexo, defina uma senha SIMPLES sem caracteres especiais!**

```bash
# ✅ Resetar senha para algo simples
gcloud sql users set-password postgres \
    --instance=valorize-dev \
    --password=ValorizeDB2025 \
    --project=valorize-475221

# Atualizar DATABASE_URL no Cloud Run
gcloud run services update valorize-api \
    --region southamerica-east1 \
    --update-env-vars 'DATABASE_URL=postgresql://postgres:ValorizeDB2025@localhost/valorize?host=/cloudsql/valorize-475221:southamerica-east1:valorize-dev'
```

**Boas práticas para senhas em DATABASE_URL:**
- ✅ Use letras maiúsculas e minúsculas
- ✅ Use números
- ❌ Evite caracteres especiais como `[]<>&=@#$%^*()`
- ✅ Exemplo: `MySecurePass2025`
- ✅ Exemplo: `Valorize2025DB`

**Ferramenta para testar URL encoding (se necessário):**
```bash
# Python (já vem instalado no Mac/Linux)
python3 -c "import urllib.parse; print(urllib.parse.quote('sua_senha_aqui'))"

# Exemplo:
python3 -c "import urllib.parse; print(urllib.parse.quote('1J[>y2rUKzq6Hz9&='))"
# Output: 1J%5B%3Ey2rUKzq6Hz9%26%3D
```

#### 4. Credenciais incorretas - Testar localmente

**Verificar**: Tentar conectar via Cloud SQL Proxy localmente

```bash
# Instalar Cloud SQL Proxy
curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.darwin.amd64
chmod +x cloud_sql_proxy

# Conectar
./cloud_sql_proxy -instances=PROJECT:REGION:INSTANCE=tcp:5432

# Em outro terminal, testar
psql "postgresql://USER:PASSWORD@localhost:5432/DATABASE"
```

#### 5. Service Account sem permissões

**Verificar permissões**:
1. Acessar IAM no Console
2. Encontrar service account do Cloud Run
3. Verificar se tem role: `Cloud SQL Client`

**Adicionar permissão via CLI**:
```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
    --role="roles/cloudsql.client"
```

#### 6. Instância Cloud SQL parada

**Verificar**:
```bash
gcloud sql instances describe INSTANCE_NAME --format='value(state)'
```

**Se estiver parada, iniciar**:
```bash
gcloud sql instances patch INSTANCE_NAME --activation-policy=ALWAYS
```

---

## 💾 Erro: Out of Memory (OOM)

### Sintomas
- Container restart frequente
- Logs: "Memory limit exceeded"
- Logs mostram OOMKilled
- Performance degradada

### Soluções

#### 1. Aumentar memória alocada

```bash
gcloud run services update valorize-api \
    --memory 2Gi \
    --region southamerica-east1
```

Ou via Console: Edit & Deploy → Container → Memory

**Recomendações**:
- Node.js básico: 512 MiB - 1 GiB
- Node.js + Prisma: 1 GiB - 2 GiB
- Workloads pesados: 2 GiB - 4 GiB

#### 2. Otimizar uso de memória

```typescript
// Usar streaming para grandes queries
const users = await prisma.user.findMany({
    take: 100, // Paginar
    skip: 0
})

// Evitar carregar tudo em memória
// ❌ const all = await prisma.user.findMany()
// ✅ Use paginação ou streaming
```

#### 3. Verificar memory leaks

```bash
# Monitorar uso de memória
gcloud monitoring time-series list \
    --filter='metric.type="run.googleapis.com/container/memory/utilizations"' \
    --format="table(metric.type, resource.label)"
```

---

## ⏱️ Erro: Request Timeout

### Sintomas
- HTTP 504 Gateway Timeout
- Logs: "Request timeout"
- Requisições demoram > timeout configurado

### Soluções

#### 1. Aumentar timeout

```bash
gcloud run services update valorize-api \
    --timeout 600 \
    --region southamerica-east1
```

Máximo: 3600s (1 hora)

#### 2. Otimizar queries lentas

```typescript
// Adicionar índices no schema.prisma
@@index([userId, createdAt])

// Usar select para buscar apenas campos necessários
const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true }
})

// Usar include com cuidado
```

#### 3. Implementar cache

```typescript
// Cache em memória (exemplo simples)
const cache = new Map()

async function getCachedData(key: string) {
    if (cache.has(key)) {
        return cache.get(key)
    }
    const data = await fetchData()
    cache.set(key, data)
    return data
}
```

#### 4. Verificar cold start

**Problema**: Primeira requisição demora muito (Prisma generate, etc)

**Solução**: Manter instância mínima
```bash
gcloud run services update valorize-api \
    --min-instances 1 \
    --region southamerica-east1
```

**Trade-off**: Custo aumenta (instância sempre rodando)

---

## 🐌 Erro: Cold Start Muito Lento

### Sintomas
- Primeira requisição demora > 10s
- Logs mostram longo tempo de startup

### Soluções

#### 1. Otimizar Dockerfile

```dockerfile
# ✅ Usar alpine para menor tamanho
FROM node:18-alpine

# ✅ Multi-stage build
FROM node:18-alpine AS builder
# ... build
FROM node:18-alpine AS production
# ... apenas runtime

# ✅ Gerar Prisma Client no build
RUN npx prisma generate
```

#### 2. Reduzir tamanho da imagem

```bash
# Verificar tamanho
docker images | grep valorize-api

# Dicas:
# - Use .dockerignore
# - Não copie node_modules
# - Use npm ci --only=production
# - Remova dev dependencies
```

#### 3. Manter instância mínima (prod)

```bash
gcloud run services update valorize-api \
    --min-instances 1 \
    --region southamerica-east1
```

**Quando usar**:
- Produção com tráfego constante
- APIs críticas
- SLA rigoroso

**Trade-off**: ~$10-30/mês mesmo sem tráfego

#### 4. Otimizar startup

```typescript
// ❌ Evitar operações pesadas no startup
// Como seed, cálculos complexos, etc

// ✅ Fazer lazy loading
let prismaClient: PrismaClient | null = null

function getPrisma() {
    if (!prismaClient) {
        prismaClient = new PrismaClient()
    }
    return prismaClient
}
```

---

## 🔐 Erro: Authentication Failed (Auth0)

### Sintomas
- HTTP 401 Unauthorized
- Logs: "Invalid token"
- Swagger funciona mas endpoints retornam 401

### Soluções

#### 1. Verificar variáveis Auth0

```bash
# Verificar se estão definidas
gcloud run services describe valorize-api \
    --region southamerica-east1 \
    --format="value(spec.template.spec.containers[0].env)"
```

Deve ter:
- `AUTH0_DOMAIN`
- `AUTH0_AUDIENCE`

#### 2. Verificar formato do token

Token deve ser JWT válido com:
- Header: `Authorization: Bearer eyJhbG...`
- Issuer correto (`iss`)
- Audience correto (`aud`)

#### 3. Testar localmente

```bash
# Obter token do Auth0
TOKEN="..."

# Testar
curl -H "Authorization: Bearer $TOKEN" \
     https://your-service-url/users/me
```

#### 4. Verificar JWKS endpoint

```bash
# Deve responder
curl https://your-tenant.auth0.com/.well-known/jwks.json
```

---

## 🚫 Erro: CORS Issues

### Sintomas
- Frontend recebe CORS error
- Browser console: "has been blocked by CORS policy"
- OPTIONS request falha

### Soluções

#### 1. Configurar CORS_ORIGIN

```bash
gcloud run services update valorize-api \
    --update-env-vars CORS_ORIGIN=https://seu-frontend.com \
    --region southamerica-east1
```

#### 2. Permitir credentials

```bash
gcloud run services update valorize-api \
    --update-env-vars CORS_CREDENTIALS=true \
    --region southamerica-east1
```

#### 3. Verificar código

```typescript
// src/config/app.ts
await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? true, // true = permite tudo
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
})
```

---

## 📊 Métricas Estranhas

### Problema: Muitas instâncias rodando

**Verificar**:
```bash
gcloud run services describe valorize-api \
    --region southamerica-east1 \
    --format="value(spec.template.spec.containerConcurrency)"
```

**Ajustar concurrency**:
```bash
gcloud run services update valorize-api \
    --concurrency 80 \
    --region southamerica-east1
```

### Problema: CPU sempre alta

**Causas**:
- Queries não otimizadas
- Loops infinitos
- Memory leaks
- N+1 queries

**Diagnosticar**: Usar Cloud Profiler

---

## 🔄 Rollback de Emergência

Se algo der muito errado:

```bash
# 1. Listar revisões
gcloud run revisions list \
    --service valorize-api \
    --region southamerica-east1

# 2. Identificar revisão anterior (working)
# Geralmente tem nome: valorize-api-00003-abc

# 3. Fazer rollback
gcloud run services update-traffic valorize-api \
    --to-revisions valorize-api-00003-abc=100 \
    --region southamerica-east1

# 4. Verificar
gcloud run services describe valorize-api \
    --region southamerica-east1 \
    --format="value(status.traffic)"
```

---

## 🆘 Comandos de Emergência

```bash
# Parar de receber tráfego (sem deletar)
gcloud run services update valorize-api \
    --no-allow-unauthenticated \
    --region southamerica-east1

# Ver todas as revisões e seus status
gcloud run revisions list \
    --service valorize-api \
    --region southamerica-east1 \
    --format="table(metadata.name, status.conditions[0].status, status.conditions[0].reason)"

# Deletar revisão problemática
gcloud run revisions delete REVISION_NAME \
    --region southamerica-east1

# Forçar nova revisão (sem mudanças)
gcloud run services update valorize-api \
    --region southamerica-east1 \
    --update-labels deployed=$(date +%s)
```

---

## 📞 Quando Pedir Ajuda

Antes de abrir ticket de suporte, colete:

1. **Logs completos**
   ```bash
   gcloud run services logs read valorize-api --limit 500 > logs.txt
   ```

2. **Descrição do serviço**
   ```bash
   gcloud run services describe valorize-api --region southamerica-east1 > service.yaml
   ```

3. **Métricas do período do problema**
   - Screenshot do Cloud Run metrics
   - Timestamp exato do problema

4. **Passos para reproduzir**
   - Comando curl que falha
   - Logs de erro específicos

---

## 📚 Recursos Adicionais

- [Cloud Run Troubleshooting](https://cloud.google.com/run/docs/troubleshooting)
- [Cloud SQL Troubleshooting](https://cloud.google.com/sql/docs/postgres/troubleshooting)
- [Prisma Troubleshooting](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [Stack Overflow - google-cloud-run](https://stackoverflow.com/questions/tagged/google-cloud-run)

---

**Dica**: A maioria dos problemas pode ser diagnosticada pelos logs. Sempre comece por lá! 🔍

