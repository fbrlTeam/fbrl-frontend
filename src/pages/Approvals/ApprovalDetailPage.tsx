import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useApprovalDetail, useApproveTransfer, useRejectTransfer } from '../../hooks/queries';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

export default function ApprovalDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useApprovalDetail(requestId || '');
  const approveMutation = useApproveTransfer();
  const rejectMutation = useRejectTransfer();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  if (!requestId) return null;

  const handleApprove = async () => {
    if (!confirm('승인하시겠습니까?')) return;
    try {
      await approveMutation.mutateAsync(requestId);
      navigate('/approvals');
    } catch {
      alert('승인에 실패했습니다.');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await rejectMutation.mutateAsync({
        requestId,
        data: { rejectionReason },
      });
      setShowRejectModal(false);
      navigate('/approvals');
    } catch {
      alert('거절에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-gray-400">승인 요청을 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/approvals')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors duration-150"
      >
        <ArrowLeft size={16} />
        돌아가기
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1">승인 요청</p>
            <p className="text-sm font-mono text-gray-500">{data.requestId}</p>
          </div>
          <StatusBadge status={data.status} type="approval" />
        </div>

        <div className="h-px bg-gray-100" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">출금 계좌</p>
            <p className="text-sm font-semibold text-gray-900">{data.fromAccountNumber}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">입금 계좌</p>
            <p className="text-sm font-semibold text-gray-900">{data.toAccountNumber}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">금액</p>
            <p className="text-lg font-bold text-gray-900">{Number(data.amount).toLocaleString()}원</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">실행 상태</p>
            <StatusBadge status={data.executionStatus} type="execution" />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">기안자</p>
            <p className="text-sm text-gray-900">{data.makerId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">승인자</p>
            <p className="text-sm text-gray-900">{data.checkerId || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">기안일시</p>
            <p className="text-sm text-gray-700">{format(new Date(data.requestedAt), 'yyyy.MM.dd HH:mm:ss')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">처리일시</p>
            <p className="text-sm text-gray-700">{data.decidedAt ? format(new Date(data.decidedAt), 'yyyy.MM.dd HH:mm:ss') : '-'}</p>
          </div>
        </div>

        {data.rejectionReason && (
          <>
            <div className="h-px bg-gray-100" />
            <div>
              <p className="text-xs text-gray-400 mb-1">거절 사유</p>
              <p className="text-sm text-red-600">{data.rejectionReason}</p>
            </div>
          </>
        )}
      </div>

      {data.status === 'PENDING' && (
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={approveMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            <Check size={16} />
            승인
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.98] text-gray-700 text-sm font-semibold rounded-xl transition-all duration-200"
          >
            <X size={16} />
            거절
          </button>
        </div>
      )}

      <Modal open={showRejectModal} onClose={() => setShowRejectModal(false)} title="거절 사유">
        <form onSubmit={handleReject} className="space-y-3">
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="거절 사유를 입력하세요"
            required
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white border border-transparent focus:border-blue-500 transition-all duration-200"
          />
          <button
            type="submit"
            disabled={rejectMutation.isPending}
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            거절하기
          </button>
        </form>
      </Modal>
    </div>
  );
}
