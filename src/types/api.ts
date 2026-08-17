export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ExecutionStatus = 'NOT_APPLICABLE' | 'EXECUTED' | 'FAILED';
export type ReconciliationStatus = 'MISMATCH' | 'NO_SNAPSHOT';
export type LedgerDirection = 'DEBIT' | 'CREDIT';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface ErrorResponse {
  code: string;
  message: string;
  timestamp: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface AccountResponse {
  id: number;
  accountNumber: string;
  balance: number;
  version: number;
}

export interface TransferMoneyRequest {
  senderAccountNumber: string;
  receiverAccountNumber: string;
  amount: number;
}

export interface LedgerEntryResponse {
  id: number;
  accountNumber: string;
  direction: LedgerDirection;
  amount: number;
  transactionId: string;
  occurredAt: string;
}

export interface EodSnapshotResponse {
  id: number;
  accountNumber: string;
  closingBalance: number;
  interestAmount: number;
  settlementDate: string;
  computedAt: string;
}

export interface PendingApprovalResponse {
  requestId: string;
  makerId: string;
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  status: ApprovalStatus;
  requestedAt: string;
}

export interface TransferApprovalDetailResponse {
  requestId: string;
  makerId: string;
  checkerId: string | null;
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  status: ApprovalStatus;
  rejectionReason: string | null;
  executionStatus: ExecutionStatus;
  requestedAt: string;
  decidedAt: string | null;
}

export interface RequestTransferApprovalRequest {
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
}

export interface RejectTransferRequest {
  rejectionReason: string;
}

export interface ApprovalDecisionResponse {
  requestId: string;
  status: ApprovalStatus;
}

export interface ReconciliationDiscrepancyResponse {
  id: number;
  accountNumber: string;
  settlementDate: string;
  expectedBalance: number | null;
  actualBalance: number | null;
  status: ReconciliationStatus;
  computedAt: string;
}

export interface BatchJobExecutionSummaryResponse {
  jobName: string;
  status: string;
  startTime: string;
  endTime: string | null;
  exitDescription: string;
}

export interface OutboxEventResponse {
  id: number;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  createdAt: string;
}

export interface AuditChainVerificationResponse {
  valid: boolean;
  totalEntries: number;
  brokenAtId: number | null;
  reason: string | null;
}
