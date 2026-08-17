import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accounts, approvals, eodSnapshots, reconciliation, batchJobs, audit, transfers, auth } from '../api/endpoints';
import type { LoginRequest, TransferMoneyRequest, RequestTransferApprovalRequest, RejectTransferRequest, ApprovalStatus, ReconciliationStatus } from '../types/api';

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginRequest) => auth.login(data),
  });
}

export function useAccount(accountNumber: string) {
  return useQuery({
    queryKey: ['account', accountNumber],
    queryFn: () => accounts.get(accountNumber),
    enabled: !!accountNumber,
  });
}

export function useCreateAccount() {
  return useMutation({
    mutationFn: () => accounts.create(),
  });
}

export function useLedgerEntries(accountNumber: string, from: string, to: string, page = 0, size = 20) {
  return useQuery({
    queryKey: ['ledgerEntries', accountNumber, from, to, page, size],
    queryFn: () => accounts.getLedgerEntries(accountNumber, from, to, page, size),
    enabled: !!accountNumber && !!from && !!to,
  });
}

export function useAccountEodSnapshots(accountNumber: string, from?: string, to?: string, page = 0, size = 20) {
  return useQuery({
    queryKey: ['accountEodSnapshots', accountNumber, from, to, page, size],
    queryFn: () => accounts.getEodSnapshots(accountNumber, from, to, page, size),
    enabled: !!accountNumber,
  });
}

export function useTransfer() {
  return useMutation({
    mutationFn: (data: TransferMoneyRequest) => transfers.transfer(data),
  });
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: ['pendingApprovals'],
    queryFn: () => approvals.getPending(),
  });
}

export function useSearchApprovals(from: string, to: string, status?: ApprovalStatus, page = 0, size = 20) {
  return useQuery({
    queryKey: ['approvals', from, to, status, page, size],
    queryFn: () => approvals.search(from, to, status, page, size),
    enabled: !!from && !!to,
  });
}

export function useApprovalDetail(requestId: string) {
  return useQuery({
    queryKey: ['approval', requestId],
    queryFn: () => approvals.getDetail(requestId),
    enabled: !!requestId,
  });
}

export function useRequestApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RequestTransferApprovalRequest) => approvals.request(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pendingApprovals'] }),
  });
}

export function useApproveTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => approvals.approve(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pendingApprovals'] });
      qc.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useRejectTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: RejectTransferRequest }) =>
      approvals.reject(requestId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pendingApprovals'] });
      qc.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useEodSnapshotsByDate(date: string, page = 0, size = 20) {
  return useQuery({
    queryKey: ['eodSnapshots', date, page, size],
    queryFn: () => eodSnapshots.getByDate(date, page, size),
    enabled: !!date,
  });
}

export function useReconciliationDiscrepancies(from: string, to: string, status?: ReconciliationStatus, page = 0, size = 20) {
  return useQuery({
    queryKey: ['reconciliation', from, to, status, page, size],
    queryFn: () => reconciliation.search(from, to, status, page, size),
    enabled: !!from && !!to,
  });
}

export function useBatchJobExecutions(jobName: string, page = 0, size = 20) {
  return useQuery({
    queryKey: ['batchJobs', jobName, page, size],
    queryFn: () => batchJobs.getExecutions(jobName, page, size),
    enabled: !!jobName,
  });
}

export function useAuditEvents(page = 0, size = 20) {
  return useQuery({
    queryKey: ['auditEvents', page, size],
    queryFn: () => audit.getEvents(page, size),
  });
}

export function useAuditVerify() {
  return useMutation({
    mutationFn: () => audit.verify(),
  });
}
