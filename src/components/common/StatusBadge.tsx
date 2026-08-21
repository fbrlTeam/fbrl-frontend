import type { ApprovalStatus, ExecutionStatus, ReconciliationStatus } from '../../types/api';

type BadgeVariant = 'navy' | 'green' | 'red' | 'amber' | 'gray';

/* 은행 백오피스 관례: 채도 낮은 배경 + 진한 텍스트 + 좌측 상태점 */
const variantClasses: Record<BadgeVariant, { chip: string; dot: string }> = {
  navy: { chip: 'bg-navy-50 text-navy-700 border-navy-100', dot: 'bg-navy-500' },
  green: { chip: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
  red: { chip: 'bg-red-50 text-red-700 border-red-100', dot: 'bg-red-500' },
  amber: { chip: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
  gray: { chip: 'bg-ink-200/60 text-ink-600 border-ink-200', dot: 'bg-ink-400' },
};

const approvalVariant: Record<ApprovalStatus, BadgeVariant> = {
  PENDING: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
};

const executionVariant: Record<ExecutionStatus, BadgeVariant> = {
  NOT_APPLICABLE: 'gray',
  EXECUTED: 'green',
  FAILED: 'red',
};

const reconciliationVariant: Record<ReconciliationStatus, BadgeVariant> = {
  MISMATCH: 'red',
  NO_SNAPSHOT: 'amber',
};

const approvalLabel: Record<ApprovalStatus, string> = {
  PENDING: '결재 대기',
  APPROVED: '승인',
  REJECTED: '반려',
};

const executionLabel: Record<ExecutionStatus, string> = {
  NOT_APPLICABLE: '해당 없음',
  EXECUTED: '집행 완료',
  FAILED: '집행 실패',
};

const reconciliationLabel: Record<ReconciliationStatus, string> = {
  MISMATCH: '불일치',
  NO_SNAPSHOT: '스냅샷 없음',
};

const batchLabel: Record<string, string> = {
  COMPLETED: '정상 종료',
  FAILED: '실패',
  STARTED: '실행 중',
  STARTING: '시작 중',
  STOPPED: '중단',
};

interface StatusBadgeProps {
  status: string;
  type?: 'approval' | 'execution' | 'reconciliation' | 'batch';
  /** 코드 원문을 함께 노출 (상세 화면용) */
  showCode?: boolean;
}

export default function StatusBadge({ status, type = 'approval', showCode }: StatusBadgeProps) {
  let variant: BadgeVariant = 'gray';
  let label = status;

  if (type === 'approval' && status in approvalVariant) {
    variant = approvalVariant[status as ApprovalStatus];
    label = approvalLabel[status as ApprovalStatus];
  } else if (type === 'execution' && status in executionVariant) {
    variant = executionVariant[status as ExecutionStatus];
    label = executionLabel[status as ExecutionStatus];
  } else if (type === 'reconciliation' && status in reconciliationVariant) {
    variant = reconciliationVariant[status as ReconciliationStatus];
    label = reconciliationLabel[status as ReconciliationStatus];
  } else if (type === 'batch') {
    if (status === 'COMPLETED') variant = 'green';
    else if (status === 'FAILED') variant = 'red';
    else if (status === 'STARTED' || status === 'STARTING') variant = 'navy';
    else variant = 'gray';
    label = batchLabel[status] ?? status;
  }

  const v = variantClasses[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 h-[22px] px-2 rounded border text-[11px] font-semibold whitespace-nowrap ${v.chip}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
      {label}
      {showCode && status !== label && (
        <span className="mono text-[10px] font-normal opacity-50">{status}</span>
      )}
    </span>
  );
}
