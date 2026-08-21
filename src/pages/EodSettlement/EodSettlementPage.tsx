import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useEodSnapshotsByDate } from '../../hooks/queries';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';

export default function EodSettlementPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const { data, isLoading } = useEodSnapshotsByDate(date, page);

  const rows = data?.content ?? [];
  const closingSum = rows.reduce((s, r) => s + Number(r.closingBalance), 0);
  const interestSum = rows.reduce((s, r) => s + Number(r.interestAmount), 0);

  return (
    <div>
      <PageHeader
        title="EOD 정산"
        description="일자별 전체 계좌의 마감 스냅샷과 일할 이자 계산 결과입니다"
        actions={
          <div className="flex items-center gap-2">
            <label className="field-label">정산일</label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(0);
              }}
              className="field w-auto"
            />
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <SummaryTile label="스냅샷 계좌 수" value={(data?.totalElements ?? 0).toLocaleString()} unit="건" />
        <SummaryTile label="마감 잔액 합계" value={closingSum.toLocaleString()} unit="원" />
        <SummaryTile label="지급 이자 합계" value={interestSum.toLocaleString()} unit="원" accent />
      </div>

      <DataTable
        columns={[
          {
            key: 'accountNumber',
            header: '계좌번호',
            render: (item) => (
              <span className="mono text-[12px] font-medium text-ink-800">{item.accountNumber}</span>
            ),
          },
          {
            key: 'closingBalance',
            header: '마감 잔액',
            align: 'right',
            render: (item) => (
              <span className="font-semibold text-ink-900">
                {Number(item.closingBalance).toLocaleString()}원
              </span>
            ),
          },
          {
            key: 'interestAmount',
            header: '일할 이자',
            align: 'right',
            render: (item) => (
              <span className={Number(item.interestAmount) > 0 ? 'text-emerald-700 font-medium' : 'text-ink-400'}>
                {Number(item.interestAmount) > 0 ? '+' : ''}
                {Number(item.interestAmount).toLocaleString()}원
              </span>
            ),
          },
          {
            key: 'settlementDate',
            header: '정산일',
            render: (item) => <span className="text-ink-600">{item.settlementDate}</span>,
          },
          {
            key: 'computedAt',
            header: '계산일시',
            align: 'right',
            render: (item) => (
              <span className="text-ink-500">
                {format(new Date(item.computedAt), 'yyyy.MM.dd HH:mm:ss')}
              </span>
            ),
          },
        ]}
        data={rows}
        page={page}
        totalPages={data?.totalPages || 0}
        totalElements={data?.totalElements || 0}
        onPageChange={setPage}
        onRowClick={(item) => navigate(`/accounts/${item.accountNumber}`)}
        loading={isLoading}
        emptyMessage="해당 정산일에 생성된 EOD 스냅샷이 없습니다"
      />
    </div>
  );
}

function SummaryTile({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
}) {
  return (
    <div className="panel p-4">
      <p className="field-label">{label}</p>
      <p className={`text-[22px] font-bold tnum mt-2 leading-none ${accent ? 'text-emerald-700' : 'text-ink-900'}`}>
        {value}
        <span className="text-[12px] font-medium text-ink-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}
