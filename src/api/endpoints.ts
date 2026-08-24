import client from './client';
import type {
  LoginRequest,
  LoginResponse,
  AccountResponse,
  TransferMoneyRequest,
  LedgerEntryResponse,
  EodSnapshotResponse,
  PendingApprovalResponse,
  TransferApprovalDetailResponse,
  RequestTransferApprovalRequest,
  RejectTransferRequest,
  ApprovalDecisionResponse,
  ReconciliationDiscrepancyResponse,
  BatchJobExecutionSummaryResponse,
  OutboxEventResponse,
  AuditChainVerificationResponse,
  PageResponse,
  ApprovalStatus,
  ReconciliationStatus,
  DemoResetStatusResponse,
  DemoBatchTriggerResponse,
} from '../types/api';

export const auth = {
  login: (data: LoginRequest) =>
    client.post<LoginResponse>('/api/v1/auth/login', data).then((r) => r.data),
};

export const accounts = {
  create: () =>
    client.post<AccountResponse>('/api/v1/accounts').then((r) => r.data),

  get: (accountNumber: string) =>
    client.get<AccountResponse>(`/api/v1/accounts/${accountNumber}`).then((r) => r.data),

  getLedgerEntries: (
    accountNumber: string,
    from: string,
    to: string,
    page = 0,
    size = 20
  ) =>
    client
      .get<PageResponse<LedgerEntryResponse>>(
        `/api/v1/accounts/${accountNumber}/ledger-entries`,
        { params: { from, to, page, size } }
      )
      .then((r) => r.data),

  getEodSnapshots: (
    accountNumber: string,
    from?: string,
    to?: string,
    page = 0,
    size = 20
  ) =>
    client
      .get<PageResponse<EodSnapshotResponse>>(
        `/api/v1/accounts/${accountNumber}/eod-snapshots`,
        { params: { from, to, page, size } }
      )
      .then((r) => r.data),
};

export const transfers = {
  transfer: (data: TransferMoneyRequest) =>
    client.post('/api/v1/transfers', data, {
      headers: { 'X-Idempotency-Key': crypto.randomUUID() },
    }),
};

export const approvals = {
  request: (data: RequestTransferApprovalRequest) =>
    client
      .post<ApprovalDecisionResponse>('/api/v1/transfer-approvals', data)
      .then((r) => r.data),

  search: (
    from: string,
    to: string,
    status?: ApprovalStatus,
    page = 0,
    size = 20
  ) =>
    client
      .get<PageResponse<TransferApprovalDetailResponse>>(
        '/api/v1/transfer-approvals',
        { params: { from, to, status, page, size } }
      )
      .then((r) => r.data),

  getPending: () =>
    client
      .get<PendingApprovalResponse[]>('/api/v1/transfer-approvals/pending')
      .then((r) => r.data),

  getDetail: (requestId: string) =>
    client
      .get<TransferApprovalDetailResponse>(
        `/api/v1/transfer-approvals/${requestId}`
      )
      .then((r) => r.data),

  approve: (requestId: string) =>
    client
      .post<ApprovalDecisionResponse>(
        `/api/v1/transfer-approvals/${requestId}/approve`
      )
      .then((r) => r.data),

  reject: (requestId: string, data: RejectTransferRequest) =>
    client
      .post<ApprovalDecisionResponse>(
        `/api/v1/transfer-approvals/${requestId}/reject`,
        data
      )
      .then((r) => r.data),
};

export const eodSnapshots = {
  getByDate: (date: string, page = 0, size = 20) =>
    client
      .get<PageResponse<EodSnapshotResponse>>('/api/v1/eod-snapshots', {
        params: { date, page, size },
      })
      .then((r) => r.data),
};

export const reconciliation = {
  search: (
    from: string,
    to: string,
    status?: ReconciliationStatus,
    page = 0,
    size = 20
  ) =>
    client
      .get<PageResponse<ReconciliationDiscrepancyResponse>>(
        '/api/v1/reconciliation-discrepancies',
        { params: { from, to, status, page, size } }
      )
      .then((r) => r.data),
};

export const batchJobs = {
  getExecutions: (jobName: string, page = 0, size = 20) =>
    client
      .get<PageResponse<BatchJobExecutionSummaryResponse>>(
        `/api/v1/batch-jobs/${jobName}/executions`,
        { params: { page, size } }
      )
      .then((r) => r.data),
};

export const audit = {
  getEvents: (page = 0, size = 20) =>
    client
      .get<PageResponse<OutboxEventResponse>>('/api/v1/audit/events', {
        params: { page, size },
      })
      .then((r) => r.data),

  verify: () =>
    client
      .get<AuditChainVerificationResponse>('/api/v1/audit/verify')
      .then((r) => r.data),
};

/** 공개 데모 랩 — 운영 데이터와 완전히 분리된 별도 DataSource/네임스페이스. */
export const demo = {
  createAccount: () =>
    client.post<AccountResponse>('/api/v1/demo/accounts').then((r) => r.data),

  getAccount: (accountNumber: string) =>
    client.get<AccountResponse>(`/api/v1/demo/accounts/${accountNumber}`).then((r) => r.data),

  getLedgerEntries: (accountNumber: string, from: string, to: string, page = 0, size = 20) =>
    client
      .get<PageResponse<LedgerEntryResponse>>(`/api/v1/demo/accounts/${accountNumber}/ledger-entries`, {
        params: { from, to, page, size },
      })
      .then((r) => r.data),

  transfer: (data: TransferMoneyRequest) =>
    client.post('/api/v1/demo/transfers', data, {
      headers: { 'X-Idempotency-Key': crypto.randomUUID() },
    }),

  requestApproval: (data: RequestTransferApprovalRequest) =>
    client
      .post<ApprovalDecisionResponse>('/api/v1/demo/transfer-approvals', data)
      .then((r) => r.data),

  getPendingApprovals: () =>
    client.get<PendingApprovalResponse[]>('/api/v1/demo/transfer-approvals/pending').then((r) => r.data),

  searchApprovals: (from: string, to: string, status?: ApprovalStatus, page = 0, size = 20) =>
    client
      .get<PageResponse<TransferApprovalDetailResponse>>('/api/v1/demo/transfer-approvals', {
        params: { from, to, status, page, size },
      })
      .then((r) => r.data),

  getApproval: (requestId: string) =>
    client
      .get<TransferApprovalDetailResponse>(`/api/v1/demo/transfer-approvals/${requestId}`)
      .then((r) => r.data),

  approve: (requestId: string) =>
    client
      .post<ApprovalDecisionResponse>(`/api/v1/demo/transfer-approvals/${requestId}/approve`)
      .then((r) => r.data),

  reject: (requestId: string, data: RejectTransferRequest) =>
    client
      .post<ApprovalDecisionResponse>(`/api/v1/demo/transfer-approvals/${requestId}/reject`, data)
      .then((r) => r.data),

  verifyAuditChain: () =>
    client.get<AuditChainVerificationResponse>('/api/v1/demo/audit/verify').then((r) => r.data),

  getAuditEvents: (page = 0, size = 20) =>
    client
      .get<PageResponse<OutboxEventResponse>>('/api/v1/demo/audit/events', { params: { page, size } })
      .then((r) => r.data),

  getBatchJobExecutions: (jobName: string, page = 0, size = 20) =>
    client
      .get<PageResponse<BatchJobExecutionSummaryResponse>>(`/api/v1/demo/batch-jobs/${jobName}/executions`, {
        params: { page, size },
      })
      .then((r) => r.data),

  triggerEodSettlement: () =>
    client.post<DemoBatchTriggerResponse>('/api/v1/demo/batch-jobs/eod/trigger').then((r) => r.data),

  triggerReconciliation: () =>
    client.post<DemoBatchTriggerResponse>('/api/v1/demo/batch-jobs/reconciliation/trigger').then((r) => r.data),

  getEodSnapshotsByDate: (date: string, page = 0, size = 20) =>
    client
      .get<PageResponse<EodSnapshotResponse>>('/api/v1/demo/eod-snapshots', { params: { date, page, size } })
      .then((r) => r.data),

  getEodSnapshotHistory: (accountNumber: string, from?: string, to?: string, page = 0, size = 20) =>
    client
      .get<PageResponse<EodSnapshotResponse>>(`/api/v1/demo/eod-snapshots/${accountNumber}`, {
        params: { from, to, page, size },
      })
      .then((r) => r.data),

  getReconciliationDiscrepancies: (from: string, to: string, status?: ReconciliationStatus, page = 0, size = 20) =>
    client
      .get<PageResponse<ReconciliationDiscrepancyResponse>>('/api/v1/demo/reconciliation-discrepancies', {
        params: { from, to, status, page, size },
      })
      .then((r) => r.data),

  getResetStatus: () =>
    client.get<DemoResetStatusResponse>('/api/v1/demo/reset-status').then((r) => r.data),
};
