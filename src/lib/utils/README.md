# Utility Functions

## Prisma Error Formatter

O formatador de erros do Prisma (`prisma-error-formatter.ts`) melhora significativamente a legibilidade dos erros do Prisma no console durante o desenvolvimento.

### Funcionalidades

- **Detecção automática**: Identifica automaticamente erros do Prisma
- **Formatação estruturada**: Organiza erros em seções claras e legíveis
- **Destaque visual**: Usa emojis e cores para facilitar a identificação rápida de problemas
- **Contexto de código**: Exibe o código onde o erro ocorreu com destaque
- **Stack trace limpo**: Mostra apenas as linhas relevantes do stack trace (exclui node_modules)

### Exemplo de Saída

#### Antes (erro não formatado)

```json
{
  "name": "PrismaClientValidationError",
  "message": "\nInvalid `this.prisma.permission.upsert()` invocation in\n/path/to/file.ts:17:36\n\n  14 this.logStart()\n  15 \n  16 for (const permission of PERMISSIONS) {\n→ 17   await this.prisma.permission.upsert({\n         where: {\n           name: \"users:read\"\n         },\n         create: {\n           name: \"users:read\",\n           category: \"User Management\",\n           ~~~~~~~~\n         }\n       })\n\nUnknown argument `category`. Available options are marked with ?.",
  "stack": "PrismaClientValidationError: ... (muito texto)"
}
```

#### Depois (erro formatado)

```bash
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 PrismaClientValidationError
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Location:
   File: /path/to/file.ts
   Line: 17, Column: 36

❌ Error:
   Unknown argument `category`. Available options are marked with ?.

📝 Code Context:

     14 this.logStart()
     15
     16 for (const permission of PERMISSIONS) {
   ➜ 17   await this.prisma.permission.upsert({  ⚠️ Error occurs here
            where: {
              name: "users:read"
            },
            create: {
              name: "users:read",
              category: "User Management",  ⚠️
            }
          })

📚 Stack Trace (relevant files):
   PermissionSeeder.seed (/path/to/file.ts:17:7)
   async seed (/path/to/index.ts:38:5)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Uso

O formatador é automaticamente integrado ao logger da aplicação. Todos os erros do Prisma registrados através do `logger.error()` serão formatados automaticamente.

```typescript
import { logger } from '@/lib/logger'

try {
  await prisma.user.create({ /* ... */ })
} catch (error) {
  // O erro será automaticamente formatado se for um erro do Prisma
  logger.error('Erro ao criar usuário', error)
}
```

### API

#### `isPrismaError(error: unknown): boolean`
Verifica se um erro é um erro do Prisma.

#### `formatPrismaError(error: PrismaError): string`
Formata um erro do Prisma em uma string legível e estruturada.

#### `getErrorSummary(error: PrismaError): object`
Extrai as informações mais importantes de um erro do Prisma.

### Tipos de Erros Suportados

O formatador detecta e formata os seguintes tipos de erros do Prisma:

- `PrismaClientValidationError` - Erros de validação de argumentos
- `PrismaClientKnownRequestError` - Erros conhecidos (ex: violação de constraint)
- `PrismaClientUnknownRequestError` - Erros desconhecidos do banco
- `PrismaClientRustPanicError` - Erros internos do Prisma
- `PrismaClientInitializationError` - Erros de inicialização

### Configuração

O formatador respeita a variável de ambiente `NODE_ENV`:
- **Development**: Erros são formatados com cores e estrutura visual
- **Production**: Erros são registrados em formato JSON

### Benefícios

1. **Debugação mais rápida**: Identificação imediata do problema
2. **Melhor experiência do desenvolvedor**: Erros claros e bem estruturados
3. **Menos frustração**: Não é mais necessário decifrar JSONs enormes
4. **Localização precisa**: Arquivo, linha e coluna onde o erro ocorreu
5. **Contexto útil**: Código relevante destacado
