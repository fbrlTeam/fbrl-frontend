import { useState } from 'react';
import { format } from 'date-fns';
import { useEodSnapshotsByDate } from '../../hooks/queries';
import DataTable from '../../components/common/DataTable';

export default function EodSettlementPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [page, setPage] = useState(0);
  const { data, isLoading } = useEodSnapshotsByDate(date, page);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">EOD 정산</h2>
        <p className="text-sm text-gray-400 mt-1">일별 전체 계좌 마감 스냅샷을 조회합니다</p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); setPage(0); }}
          className="px-4 py-2.5 bg-white rounded-xl border border-gray-100 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
        />
      </div>

      <DataTable
        columns={[
          {
            key: 'accountNumber',
            header: '계좌번호',
            render: (item) => <span className="font-mono text-xs">{item.accountNumber}</span>,
          },
          {
            key: 'closingBalance',
            header: '마감잔액',
            render: (item) => (
              <span className="font-semibold">{Number(item.closingBalance).toLocaleString()}원</span>
            ),
          },
          {
            key: 'interestAmount',
            header: '이자',
            render: (item) => `${Number(item.interestAmount).toLocaleString()}원`,
          },
          {
            key: 'settlementDate',
            header: '정산일',
            render: (item) => item.settlementDate,
          },
          {
            key: 'computedAt',
            header: '계산일시',
            render: (item) => format(new Date(item.computedAt), 'yyyy.MM.dd HH:mm'),
          },
        ]}
        data={data?.content || []}
        page={page}
        totalPages={data?.totalPages || 0}
        totalElements={data?.totalElements || 0}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage="해당일 EOD 스냅샷이 없습니다"
      />
    </div>
  );
}
