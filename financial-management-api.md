Financial Management API - Resumo da Implementação
Endpoints Implementados
1. Listar Cobranças
GET /backoffice/financial/charges
Query Parameters:
{
  page?: number          // default: 1
  limit?: number         // default: 20, max: 100
  sortBy?: 'issueDate' | 'dueDate' | 'amount' | 'status'
  sortOrder?: 'asc' | 'desc'
  companyId?: string
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELED' | 'PARTIAL'
  dueDateFrom?: string   // ISO date
  dueDateTo?: string
  issueDateFrom?: string
  issueDateTo?: string
  search?: string        // busca em description, notes, company name
}
Response 200:
{
  success: true,
  data: [
    {
      id: string,
      companyId: string,
      amount: number,
      description: string,
      dueDate: string,
      issueDate: string,
      status: ChargeStatus,
      paymentMethod: string | null,
      paidAt: string | null,
      canceledAt: string | null,
      notes: string | null,
      createdBy: string,
      createdAt: string,
      updatedAt: string,
      company: { id, name, cnpj },
      createdByUser: { id, name, email },
      attachments: [...],
      payments: [...]
    }
  ],
  pagination: { page, limit, total, totalPages },
  aggregations: {
    totalAmount: number,
    pendingAmount: number,
    paidAmount: number,
    overdueAmount: number,
    partialAmount: number,
    chargesByStatus: { PENDING: 0, PAID: 0, ... }
  }
}
2. Detalhes de uma Cobrança
GET /backoffice/financial/charges/:id
Response 200:
{
  success: true,
  data: {
    ...charge,  // todos os campos da cobrança
    balance: number,      // saldo restante
    totalPaid: number,    // total pago até agora
    isPaid: boolean,      // se está totalmente paga
    company: { id, name, cnpj },
    createdByUser: { id, name, email },
    attachments: [...],
    payments: [...]
  }
}
3. Criar Cobrança
POST /backoffice/financial/charges
Body:
{
  companyId: string,           // obrigatório
  amount: number,              // obrigatório, min: 0.01
  description: string,         // obrigatório, max: 500 chars
  dueDate: string,            // obrigatório, ISO date
  paymentMethod?: 'BOLETO' | 'PIX' | 'CREDIT_CARD',
  notes?: string              // max: 2000 chars
}
Response 201:
{
  success: true,
  data: { ...charge }  // objeto Charge completo
}
4. Atualizar Cobrança
PATCH /backoffice/financial/charges/:id
Body (todos campos opcionais):
{
  amount?: number,
  description?: string,
  dueDate?: string,
  paymentMethod?: 'BOLETO' | 'PIX' | 'CREDIT_CARD',
  notes?: string
}
Response 200:
{
  success: true,
  data: { ...charge }
}
Regra: Não permite atualizar cobranças PAID ou CANCELED
5. Deletar Cobrança
DELETE /backoffice/financial/charges/:id
Response 200:
{
  success: true,
  message: "Charge deleted successfully"
}
Regras:
Só permite deletar com status PENDING ou CANCELED
Não pode ter pagamentos registrados
6. Cancelar Cobrança
POST /backoffice/financial/charges/:id/cancel
Response 200:
{
  success: true,
  data: { ...charge }  // com status = CANCELED
}
Regras:
Só permite cancelar PENDING ou OVERDUE
Não pode ter pagamentos registrados
7. Registrar Pagamento
POST /backoffice/financial/charges/:id/payments
Body:
{
  amount: number,              // obrigatório, min: 0.01
  paidAt: string,             // obrigatório, ISO date-time
  paymentMethod: 'BOLETO' | 'PIX' | 'CREDIT_CARD',  // obrigatório
  notes?: string              // max: 2000 chars
}
Response 201:
{
  success: true,
  data: {
    id: string,
    chargeId: string,
    amount: number,
    paidAt: string,
    paymentMethod: string,
    notes: string | null,
    registeredBy: string,
    createdAt: string
  }
}
Regra: Atualiza automaticamente o status da cobrança (PENDING → PARTIAL → PAID)
8. Upload de Anexo
POST /backoffice/financial/charges/:id/attachments
Content-Type: multipart/form-data
Body:
file: [binary file]
Response 201:
{
  success: true,
  data: {
    id: string,
    chargeId: string,
    fileName: string,
    fileUrl: string,
    fileSize: number,
    fileType: string,
    uploadedBy: string,
    createdAt: string
  }
}
Validações: PDF, JPG, PNG, WEBP | Max: 10MB
9. Deletar Anexo
DELETE /backoffice/financial/charges/:id/attachments/:attachmentId
Response 200:
{
  success: true,
  message: "Attachment deleted successfully"
}
Status de Cobrança (ChargeStatus)
PENDING: Pendente de pagamento
PAID: Totalmente paga
OVERDUE: Vencida (dueDate < hoje e não paga)
CANCELED: Cancelada
PARTIAL: Parcialmente paga
Autenticação
Todos endpoints requerem:
Header: Authorization: Bearer {token}
Permissão: Super Admin (backoffice)