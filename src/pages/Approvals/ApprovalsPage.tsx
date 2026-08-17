import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { usePendingApprovals, useSearchApprovals, useRequestApproval } from '../../hooks/queries';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import type { ApprovalStatus } from '../../types/api';

type Tab = 'pending' | 'history';

export default function ApprovalsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('pending');
  const [historyPage, setHistoryPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | undefined>();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqFrom, setReqFrom] = useState('');
  const [reqTo, setReqTo] = useState('');
  const [reqAmount, setReqAmount] = useState('');

  const now = new Date();
  const from = subDays(now, 30).toISOString();
  const to = now.toISOString();

  const { data: pending, isLoading: pendingLoading } = usePendingApprovals();
  const { data: historyData, isLoading: historyLoading } = useSearchApprovals(
    from, to, statusFilter, historyPage
  );
  const requestMutation = useRequestApproval();

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestMutation.mutateAsync({
        fromAccountNumber: reqFrom,
        toAccountNumber: reqTo,
        amount: Number(reqAmount),
      });
      setShowRequestModal(false);
      setReqFrom('');
      setReqTo('');
      setReqAmount('');
    } catch {
      alert('기안 요청에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">승인 관리</h2>
          <p className="text-sm text-gray-400 mt-1">이체 승인 요청을 관리합니다</p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 active:scale-[0.97] text-white text-sm font-medium rounded-xl transition-all duration-200"
        >
          기안하기
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            tab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          대기 {pending && pending.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-600 text-xs rounded-md">
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            tab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          전체 이력
        </button>
      </div>

      {tab === 'pending' && (
        <div>
          {pendingLoading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !pending || pending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <p className="text-sm text-gray-400">대기 중인 승인이 없습니다</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {pending.map((item) => (
                <button
                  key={item.requestId}
                  onClick={() => navigate(`/approvals/${item.requestId}`)}
                  className="w-full bg-white rounded-2xl border border-gray-100 p-5 text-left hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {item.fromAccountNumber} → {item.toAccountNumber}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          기안자: {item.makerId} · {format(new Date(item.requestedAt), 'yyyy.MM.dd HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-gray-900">
                        {Number(item.amount).toLocaleString()}원
                      </p>
                      <StatusBadge status={item.status} type="approval" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s === '' ? undefined : s as ApprovalStatus); setHistoryPage(0); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  (s === '' && !statusFilter) || statusFilter === s
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {s === '' ? '전체' : s === 'PENDING' ? '대기' : s === 'APPROVED' ? '승인' : '거절'}
              </button>
            ))}
          </div>

          <DataTable
            columns={[
              {
                key: 'status',
                header: '상태',
                render: (item) => <StatusBadge status={item.status} type="approval" />,
              },
              {
                key: 'from',
                header: '출금',
                render: (item) => <span className="font-mono text-xs">{item.fromAccountNumber}</span>,
              },
              {
                key: 'to',
                header: '입금',
                render: (item) => <span className="font-mono text-xs">{item.toAccountNumber}</span>,
              },
              {
                key: 'amount',
                header: '금액',
                render: (item) => `${Number(item.amount).toLocaleString()}원`,
              },
              {
                key: 'maker',
                header: '기안자',
                render: (item) => item.makerId,
              },
              {
                key: 'execution',
                header: '실행',
                render: (item) => <StatusBadge status={item.executionStatus} type="execution" />,
              },
              {
                key: 'requestedAt',
                header: '기안일',
                render: (item) => format(new Date(item.requestedAt), 'MM.dd HH:mm'),
              },
            ]}
            data={historyData?.content || []}
            page={historyPage}
            totalPages={historyData?.totalPages || 0}
            totalElements={historyData?.totalElements || 0}
            onPageChange={setHistoryPage}
            loading={historyLoading}
          />
        </div>
      )}

      <Modal open={showRequestModal} onClose={() => setShowRequestModal(false)} title="승인 기안">
        <form onSubmit={handleRequest} className="space-y-3">
          <input
            type="text"
            value={reqFrom}
            onChange={(e) => setReqFrom(e.target.value)}
            placeholder="출금 계좌번호"
            required
            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white border border-transparent focus:border-blue-500 transition-all duration-200"
          />
          <input
            type="text"
            value={reqTo}
            onChange={(e) => setReqTo(e.target.value)}
            placeholder="입금 계좌번호"
            required
            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white border border-transparent focus:border-blue-500 transition-all duration-200"
          />
          <input
            type="number"
            value={reqAmount}
            onChange={(e) => setReqAmount(e.target.value)}
            placeholder="금액"
            required
            min="1"
            className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white border border-transparent focus:border-blue-500 transition-all duration-200"
          />
          <button
            type="submit"
            disabled={requestMutation.isPending}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            기안 요청
          </button>
        </form>
      </Modal>
    </div>
  );
}
