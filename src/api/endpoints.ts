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
