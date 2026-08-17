import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { useReconciliationDiscrepancies } from '../../hooks/queries';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import type { ReconciliationStatus } from '../../types/api';

export default function ReconciliationPage() {
  const now = new Date();
  const [from, setFrom] = useState(format(subDays(now, 30), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(now, 'yyyy-MM-dd'));
  const [status, setStatus] = useState<ReconciliationStatus | undefined>();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useReconciliationDiscrepancies(from, to, status, page);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">대사 불일치</h2>
        <p className="text-sm text-gray-400 mt-1">EOD 정산 대사 결과에서 불일치를 확인합니다</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setPage(0); }}
          className="px-4 py-2.5 bg-white rounded-xl border border-gray-100 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
        />
        <span className="text-sm text-gray-300">~</span>
        <input
          type="date"
          value={to}
          onChange={(e) => { setTo(e.target.value); setPage(0); }}
          className="px-4 py-2.5 bg-white rounded-xl border border-gray-100 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
        />
        <div className="flex gap-1.5">
          {([undefined, 'MISMATCH', 'NO_SNAPSHOT'] as const).map((s) => (
            <button
              key={s ?? 'all'}
              onClick={() => { setStatus(s as ReconciliationStatus | undefined); setPage(0); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                status === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {s === undefined ? '전체' : s}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={[
          {
            key: 'status',
            header: '상태',
            render: (item) => <StatusBadge status={item.status} type="reconciliation" />,
          },
          {
            key: 'accountNumber',
            header: '계좌번호',
            render: (item) => <span className="font-mono text-xs">{item.accountNumber}</span>,
          },
          {
            key: 'settlementDate',
            header: '정산일',
            render: (item) => item.settlementDate,
          },
          {
            key: 'expectedBalance',
            header: '기대잔액',
            render: (item) =>
              item.expectedBalance !== null ? `${Number(item.expectedBalance).toLocaleString()}원` : '-',
          },
          {
            key: 'actualBalance',
            header: '실제잔액',
            render: (item) =>
              item.actualBalance !== null ? `${Number(item.actualBalance).toLocaleString()}원` : '-',
          },
          {
            key: 'computedAt',
            header: '검증일시',
            render: (item) => format(new Date(item.computedAt), 'MM.dd HH:mm'),
          },
        ]}
        data={data?.content || []}
        page={page}
        totalPages={data?.totalPages || 0}
        totalElements={data?.totalElements || 0}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage="불일치가 없습니다"
      />
    </div>
  );
}
