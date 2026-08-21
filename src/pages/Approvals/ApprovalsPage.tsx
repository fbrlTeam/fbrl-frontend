import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { AlertCircle, FilePlus2, Inbox } from 'lucide-react';
import { usePendingApprovals, useSearchApprovals, useRequestApproval } from '../../hooks/queries';
import PageHeader from '../../components/common/PageHeader';
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
  const [reqError, setReqError] = useState('');

  const now = new Date();
  const from = subDays(now, 30).toISOString();
  const to = now.toISOString();

  const { data: pending, isLoading: pendingLoading } = usePendingApprovals();
  const { data: historyData, isLoading: historyLoading } = useSearchApprovals(
    from,
    to,
    statusFilter,
    historyPage
  );
  const requestMutation = useRequestApproval();

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError('');
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
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setReqError(axiosErr.response?.data?.message || '기안 요청에 실패했습니다.');
    }
  };

  return (
    <div>
      <PageHeader
        title="승인 관리"
        description="기준 금액을 초과하는 이체는 기안자와 승인자가 분리된 결재를 거쳐야 집행됩니다"
        actions={
          <button onClick={() => setShowRequestModal(true)} className="btn-primary">
            <FilePlus2 size={15} />
            이체 기안
          </button>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="segmented">
          <button data-active={tab === 'pending'} onClick={() => setTab('pending')}>
            결재 대기
            {pending && pending.length > 0 && (
              <span className="ml-1.5 px-1.5 py-px bg-amber-100 text-amber-700 text-[10px] rounded tnum">
                {pending.length}
              </span>
            )}
          </button>
          <button data-active={tab === 'history'} onClick={() => setTab('history')}>
            전체 이력
          </button>
        </div>

        {tab === 'history' && (
          <>
            <span className="w-px h-5 bg-line" />
            <div className="segmented">
              {([undefined, 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
                <button
                  key={s ?? 'all'}
                  data-active={statusFilter === s}
                  onClick={() => {
                    setStatusFilter(s as ApprovalStatus | undefined);
                    setHistoryPage(0);
                  }}
                >
                  {s === undefined ? '전체' : s === 'PENDING' ? '대기' : s === 'APPROVED' ? '승인' : '반려'}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-ink-400 tnum ml-auto">
              조회 기간 {format(subDays(now, 30), 'yyyy.MM.dd')} ~ {format(now, 'yyyy.MM.dd')}
            </span>
          </>
        )}
      </div>

      {tab === 'pending' &&
        (pendingLoading ? (
          <div className="panel p-14 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-navy-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !pending || pending.length === 0 ? (
          <div className="panel p-14 text-center">
            <Inbox size={22} className="text-ink-200 mx-auto mb-2.5" />
            <p className="text-[13px] text-ink-400">결재 대기 중인 건이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((item) => (
              <button
                key={item.requestId}
                onClick={() => navigate(`/approvals/${item.requestId}`)}
                className="panel w-full px-5 py-4 text-left border-l-[3px] border-l-amber-500 hover:border-navy-200 transition-colors duration-150"
              >
                <div className="flex items-center justify-between gap-5 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <p className="text-[13.5px] font-semibold text-ink-900 mono">
                        {item.fromAccountNumber} → {item.toAccountNumber}
                      </p>
                      <StatusBadge status={item.status} type="approval" />
                    </div>
                    <p className="text-[11.5px] text-ink-400 mt-1 tnum">
                      기안자 {item.makerId} · {format(new Date(item.requestedAt), 'yyyy.MM.dd HH:mm')} ·{' '}
                      <span className="mono">{item.requestId.slice(0, 8)}…</span>
                    </p>
                  </div>
                  <p className="text-[17px] font-bold text-ink-900 tnum shrink-0">
                    {Number(item.amount).toLocaleString()}
                    <span className="text-[12px] font-medium text-ink-400 ml-1">원</span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        ))}

      {tab === 'history' && (
        <DataTable
          columns={[
            {
              key: 'status',
              header: '결재 상태',
              render: (item) => <StatusBadge status={item.status} type="approval" />,
            },
            {
              key: 'from',
              header: '출금 계좌',
              render: (item) => <span className="mono text-[12px]">{item.fromAccountNumber}</span>,
            },
            {
              key: 'to',
              header: '입금 계좌',
              render: (item) => <span className="mono text-[12px]">{item.toAccountNumber}</span>,
            },
            {
              key: 'amount',
              header: '금액',
              align: 'right',
              render: (item) => (
                <span className="font-semibold text-ink-900">
                  {Number(item.amount).toLocaleString()}원
                </span>
              ),
            },
            { key: 'maker', header: '기안자', render: (item) => item.makerId },
            { key: 'checker', header: '승인자', render: (item) => item.checkerId || '—' },
            {
              key: 'execution',
              header: '집행 결과',
              render: (item) => <StatusBadge status={item.executionStatus} type="execution" />,
            },
            {
              key: 'requestedAt',
              header: '기안일시',
              align: 'right',
              render: (item) => (
                <span className="text-ink-500">
                  {format(new Date(item.requestedAt), 'yyyy.MM.dd HH:mm')}
                </span>
              ),
            },
          ]}
          data={historyData?.content || []}
          page={historyPage}
          totalPages={historyData?.totalPages || 0}
          totalElements={historyData?.totalElements || 0}
          onPageChange={setHistoryPage}
          onRowClick={(item) => navigate(`/approvals/${item.requestId}`)}
          loading={historyLoading}
          emptyMessage="조회 기간에 기안된 건이 없습니다"
        />
      )}

      <Modal
        open={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setReqError('');
        }}
        title="이체 기안"
      >
        <form onSubmit={handleRequest} className="space-y-4">
          <p className="text-[11.5px] text-ink-500 leading-relaxed bg-canvas border border-line rounded p-3">
            기안한 건은 <span className="font-semibold text-ink-700">본인이 승인할 수 없습니다.</span>{' '}
            다른 관리자 계정의 결재를 거쳐야 자금이 이동합니다.
          </p>

          {reqError && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded">
              <AlertCircle size={14} className="text-red-500 shrink-0 mt-px" />
              <p className="text-[12px] text-red-700 leading-relaxed">{reqError}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="field-label block">출금 계좌번호</label>
            <input
              type="text"
              value={reqFrom}
              onChange={(e) => setReqFrom(e.target.value)}
              placeholder="000-0000-0000"
              required
              className="field mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="field-label block">입금 계좌번호</label>
            <input
              type="text"
              value={reqTo}
              onChange={(e) => setReqTo(e.target.value)}
              placeholder="000-0000-0000"
              required
              className="field mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="field-label block">이체 금액</label>
            <input
              type="number"
              value={reqAmount}
              onChange={(e) => setReqAmount(e.target.value)}
              placeholder="0"
              required
              min="1"
              className="field tnum"
            />
            {reqAmount && Number(reqAmount) > 0 && (
              <p className="text-[11.5px] text-ink-500 pt-0.5 tnum">
                {Number(reqAmount).toLocaleString()}원
              </p>
            )}
          </div>

          <button type="submit" disabled={requestMutation.isPending} className="btn-primary w-full">
            기안 요청
          </button>
        </form>
      </Modal>
    </div>
  );
}
