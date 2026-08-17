import type { ApprovalStatus, ExecutionStatus, ReconciliationStatus } from '../../types/api';

type BadgeVariant = 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple';

const variantClasses: Record<BadgeVariant, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  red: 'bg-red-50 text-red-600',
  yellow: 'bg-amber-50 text-amber-600',
  gray: 'bg-gray-100 text-gray-500',
  purple: 'bg-purple-50 text-purple-600',
};

const approvalVariant: Record<ApprovalStatus, BadgeVariant> = {
  PENDING: 'yellow',
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
  NO_SNAPSHOT: 'yellow',
};

const approvalLabel: Record<ApprovalStatus, string> = {
  PENDING: '대기',
  APPROVED: '승인',
  REJECTED: '거절',
};

const executionLabel: Record<ExecutionStatus, string> = {
  NOT_APPLICABLE: '-',
  EXECUTED: '실행됨',
  FAILED: '실패',
};

interface StatusBadgeProps {
  status: string;
  type?: 'approval' | 'execution' | 'reconciliation' | 'batch';
}

export default function StatusBadge({ status, type = 'approval' }: StatusBadgeProps) {
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
    label = status;
  } else if (type === 'batch') {
    if (status === 'COMPLETED') variant = 'green';
    else if (status === 'FAILED') variant = 'red';
    else if (status === 'STARTED' || status === 'STARTING') variant = 'blue';
    else variant = 'gray';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${variantClasses[variant]}`}
    >
      {label}
    </span>
  );
}
