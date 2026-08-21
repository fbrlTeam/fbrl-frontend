import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  FileEdit,
  Clock,
  ShieldCheck,
  ShieldX,
  Zap,
  ZapOff,
  AlertTriangle,
} from 'lucide-react';
import { useApprovalDetail, useApproveTransfer, useRejectTransfer } from '../../hooks/queries';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

function extractMessage(err: unknown, fallback: string) {
  const axiosErr = err as { response?: { data?: { message?: string } } };
  return axiosErr.response?.data?.message || fallback;
}

export default function ApprovalDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { username } = useAuth();
  const { data, isLoading } = useApprovalDetail(requestId || '');
  const approveMutation = useApproveTransfer();
  const rejectMutation = useRejectTransfer();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionError, setActionError] = useState('');

  if (!requestId) return null;

  const isSelfApproval = !!data && !!username && data.makerId === username;

  const handleApprove = async () => {
    setShowApproveModal(false);
    setActionError('');
    try {
      await approveMutation.mutateAsync(requestId);
      navigate('/approvals');
    } catch (err) {
      setActionError(extractMessage(err, '승인 처리에 실패했습니다.'));
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    try {
      await rejectMutation.mutateAsync({ requestId, data: { rejectionReason } });
      setShowRejectModal(false);
      navigate('/approvals');
    } catch (err) {
      setActionError(extractMessage(err, '반려 처리에 실패했습니다.'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-5 h-5 border-2 border-navy-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="panel p-14 text-center">
        <p className="text-[13px] text-ink-400">승인 요청을 찾을 수 없습니다</p>
      </div>
    );
  }

  const decided = data.status !== 'PENDING';
  const approved = data.status === 'APPROVED';
  const rejected = data.status === 'REJECTED';

  return (
    <div>
      <button
        onClick={() => navigate('/approvals')}
        className="flex items-center gap-1.5 text-[12px] text-ink-500 hover:text-ink-800 transition-colors duration-150 mb-4"
      >
        <ArrowLeft size={14} />
        승인 관리
      </button>

      {/* 거래 요약 */}
      <div className="panel px-6 py-5 mb-3">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="field-label">기안 번호</span>
              <span className="text-[11.5px] mono text-ink-600">{data.requestId}</span>
              <StatusBadge status={data.status} type="approval" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[15px] font-semibold text-ink-900 mono">{data.fromAccountNumber}</span>
              <ArrowRight size={15} className="text-ink-300" />
              <span className="text-[15px] font-semibold text-ink-900 mono">{data.toAccountNumber}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="field-label mb-1">이체 금액</p>
            <p className="text-[28px] font-bold text-ink-900 tnum leading-none">
              {Number(data.amount).toLocaleString()}
              <span className="text-[14px] font-medium text-ink-400 ml-1">원</span>
            </p>
          </div>
        </div>
      </div>

      {/* 결재 경로 */}
      <div className="panel mb-3">
        <div className="panel-head">
          <span className="panel-title">결재 경로</span>
          <span className="text-[10.5px] text-ink-400">4-eyes principle · 기안자 ≠ 승인자</span>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-start">
            <Step
              icon={<FileEdit size={15} />}
              label="기안"
              actor={data.makerId}
              timestamp={data.requestedAt}
              state="done"
              tone="navy"
            />
            <Connector active={decided} />
            <Step
              icon={<Clock size={15} />}
              label={decided ? '검토 완료' : '검토 중'}
              actor={decided ? undefined : '결재 대기'}
              timestamp={decided ? data.requestedAt : undefined}
              state={decided ? 'done' : 'active'}
              tone="amber"
            />
            <Connector active={decided} tone={rejected ? 'red' : 'emerald'} />
            <Step
              icon={approved ? <ShieldCheck size={15} /> : rejected ? <ShieldX size={15} /> : <Clock size={15} />}
              label={approved ? '승인' : rejected ? '반려' : '결재 대기'}
              actor={data.checkerId || undefined}
              timestamp={data.decidedAt || undefined}
              state={decided ? 'done' : 'pending'}
              tone={rejected ? 'red' : 'emerald'}
            />
          </div>
        </div>
      </div>

      {/* 자금 집행 — 결재 결과와 분리 기록 */}
      {approved && (
        <div className="panel mb-3">
          <div className="panel-head">
            <span className="panel-title">자금 집행</span>
            <span className="text-[10.5px] text-ink-400">결재 결과와 별도로 기록됩니다</span>
          </div>
          <div className="px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded flex items-center justify-center ${
                  data.executionStatus === 'EXECUTED'
                    ? 'bg-emerald-50 text-emerald-600'
                    : data.executionStatus === 'FAILED'
                      ? 'bg-red-50 text-red-500'
                      : 'bg-canvas text-ink-400'
                }`}
              >
                {data.executionStatus === 'EXECUTED' ? (
                  <Zap size={16} />
                ) : data.executionStatus === 'FAILED' ? (
                  <ZapOff size={16} />
                ) : (
                  <Clock size={16} />
                )}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-ink-900">
                  {data.executionStatus === 'EXECUTED'
                    ? '자금 이동 완료'
                    : data.executionStatus === 'FAILED'
                      ? '자금 이동 실패'
                      : '집행 대기'}
                </p>
                <p className="text-[11px] text-ink-400 mono mt-0.5">
                  executionStatus: {data.executionStatus}
                </p>
              </div>
            </div>
            <StatusBadge status={data.executionStatus} type="execution" />
          </div>

          {data.executionStatus === 'FAILED' && data.executionFailureReason && (
            <div className="mx-6 mb-5 px-3.5 py-2.5 bg-red-50 border border-red-100 rounded">
              <p className="text-[10.5px] font-semibold text-red-600 mb-0.5">실패 사유</p>
              <p className="text-[12px] text-red-700 leading-relaxed">{data.executionFailureReason}</p>
            </div>
          )}

          <p className="px-6 pb-5 text-[10.5px] text-ink-400 leading-relaxed">
            승인 행위가 있었다는 사실과 그 집행 결과는 별도 필드로 관리됩니다 — 승인된 건이라도
            이상거래 탐지·잔액 부족 등으로 집행이 실패할 수 있습니다.
          </p>
        </div>
      )}

      {data.rejectionReason && (
        <div className="panel px-6 py-4 mb-3 border-l-[3px] border-l-red-500">
          <p className="field-label mb-1.5">반려 사유</p>
          <p className="text-[13px] text-ink-800">{data.rejectionReason}</p>
        </div>
      )}

      {!decided && isSelfApproval && (
        <div className="panel px-5 py-4 mb-3 border-l-[3px] border-l-amber-500 flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-px" />
          <p className="text-[12px] text-ink-700 leading-relaxed">
            본인(<span className="font-semibold">{username}</span>)이 기안한 건은 승인·반려할 수 없습니다.
            4-eyes 원칙에 따라 기안자와 승인자는 반드시 달라야 하므로, 다른 관리자 계정으로 결재해야 합니다.
          </p>
        </div>
      )}

      {actionError && (
        <div className="panel px-5 py-4 mb-3 border-l-[3px] border-l-red-500">
          <p className="text-[12px] text-red-700">{actionError}</p>
        </div>
      )}

      {!decided && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowApproveModal(true)}
            disabled={approveMutation.isPending || isSelfApproval}
            className="btn-primary flex-1 h-[42px]"
          >
            <Check size={15} />
            승인
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={isSelfApproval}
            className="btn-secondary flex-1 h-[42px]"
          >
            <X size={15} />
            반려
          </button>
        </div>
      )}

      <Modal open={showApproveModal} onClose={() => setShowApproveModal(false)} title="승인 확인">
        <div className="space-y-4">
          <div className="bg-canvas border border-line rounded p-4 space-y-2.5">
            <Row label="출금" value={data.fromAccountNumber} mono />
            <Row label="입금" value={data.toAccountNumber} mono />
            <Row label="금액" value={`${Number(data.amount).toLocaleString()}원`} strong />
            <Row label="기안자" value={data.makerId} />
          </div>
          <p className="text-[12px] text-ink-600 leading-relaxed">
            승인 즉시 자금 집행이 시작됩니다. 계속하시겠습니까?
          </p>
          <button onClick={handleApprove} disabled={approveMutation.isPending} className="btn-primary w-full">
            승인 확정
          </button>
        </div>
      </Modal>

      <Modal open={showRejectModal} onClose={() => setShowRejectModal(false)} title="반려 사유 입력">
        <form onSubmit={handleReject} className="space-y-3">
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="반려 사유를 입력하세요 (감사 기록에 남습니다)"
            required
            rows={3}
            className="field h-auto py-2.5 resize-none"
          />
          <button
            type="submit"
            disabled={rejectMutation.isPending}
            className="btn-primary w-full !bg-red-600 hover:!bg-red-700"
          >
            반려 확정
          </button>
        </form>
      </Modal>
    </div>
  );
}

function Row({ label, value, mono, strong }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="field-label">{label}</span>
      <span
        className={`text-[12.5px] ${mono ? 'mono' : ''} ${
          strong ? 'font-bold text-ink-900 tnum' : 'font-medium text-ink-700'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

type StepTone = 'navy' | 'amber' | 'emerald' | 'red';
type StepState = 'done' | 'active' | 'pending';

const toneClasses: Record<StepTone, { bg: string; text: string; ring: string }> = {
  navy: { bg: 'bg-navy-50', text: 'text-navy-600', ring: 'ring-navy-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
  red: { bg: 'bg-red-50', text: 'text-red-500', ring: 'ring-red-100' },
};

function Step({
  icon,
  label,
  actor,
  timestamp,
  state,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  actor?: string;
  timestamp?: string;
  state: StepState;
  tone: StepTone;
}) {
  const c = toneClasses[tone];
  return (
    <div className="flex flex-col items-center text-center w-28 shrink-0">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
          state === 'pending' ? 'bg-canvas text-ink-300' : `${c.bg} ${c.text}`
        } ${state === 'active' ? `ring-4 ${c.ring}` : ''}`}
      >
        {icon}
      </div>
      <p className={`text-[12px] font-semibold mt-2.5 ${state === 'pending' ? 'text-ink-300' : 'text-ink-900'}`}>
        {label}
      </p>
      {actor && <p className="text-[11px] text-ink-500 mt-0.5 truncate w-full">{actor}</p>}
      {timestamp && (
        <p className="text-[10px] text-ink-400 mt-0.5 tnum">
          {format(new Date(timestamp), 'MM.dd HH:mm')}
        </p>
      )}
    </div>
  );
}

function Connector({ active, tone = 'emerald' }: { active: boolean; tone?: 'emerald' | 'red' }) {
  return (
    <div className="flex-1 h-10 flex items-center px-2">
      <div
        className={`w-full h-0.5 rounded-full transition-colors duration-300 ${
          active ? (tone === 'red' ? 'bg-red-300' : 'bg-emerald-300') : 'bg-line'
        }`}
      />
    </div>
  );
}
