import { useState } from 'react';
import { format } from 'date-fns';
import { ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import { useAuditEvents, useAuditVerify } from '../../hooks/queries';
import DataTable from '../../components/common/DataTable';

export default function AuditLogPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useAuditEvents(page);
  const verifyMutation = useAuditVerify();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">감사 로그</h2>
          <p className="text-sm text-gray-400 mt-1">Outbox 이벤트와 해시체인 무결성을 확인합니다</p>
        </div>
        <button
          onClick={() => verifyMutation.mutate()}
          disabled={verifyMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 active:scale-[0.97] text-white text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
        >
          <ShieldCheck size={16} />
          체인 검증
        </button>
      </div>

      {verifyMutation.data && (
        <div
          className={`rounded-2xl p-5 flex items-center gap-4 ${
            verifyMutation.data.valid
              ? 'bg-emerald-50 border border-emerald-100'
              : 'bg-red-50 border border-red-100'
          }`}
        >
          {verifyMutation.data.valid ? (
            <CheckCircle size={24} className="text-emerald-500 shrink-0" />
          ) : (
            <XCircle size={24} className="text-red-500 shrink-0" />
          )}
          <div>
            <p className={`text-sm font-semibold ${verifyMutation.data.valid ? 'text-emerald-700' : 'text-red-700'}`}>
              {verifyMutation.data.valid ? '무결성 검증 통과' : '무결성 검증 실패'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              총 {verifyMutation.data.totalEntries}건
              {verifyMutation.data.brokenAtId && ` · 손상 위치: ID ${verifyMutation.data.brokenAtId}`}
              {verifyMutation.data.reason && ` · ${verifyMutation.data.reason}`}
            </p>
          </div>
        </div>
      )}

      <DataTable
        columns={[
          {
            key: 'id',
            header: 'ID',
            render: (item) => <span className="text-xs text-gray-400">#{item.id}</span>,
          },
          {
            key: 'eventType',
            header: '이벤트',
            render: (item) => (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-md">
                {item.eventType}
              </span>
            ),
          },
          {
            key: 'aggregateType',
            header: 'Aggregate',
            render: (item) => item.aggregateType,
          },
          {
            key: 'aggregateId',
            header: 'Aggregate ID',
            render: (item) => (
              <span className="font-mono text-xs text-gray-500">{item.aggregateId}</span>
            ),
          },
          {
            key: 'createdAt',
            header: '발생일시',
            render: (item) => format(new Date(item.createdAt), 'yyyy.MM.dd HH:mm:ss'),
          },
        ]}
        data={data?.content || []}
        page={page}
        totalPages={data?.totalPages || 0}
        totalElements={data?.totalElements || 0}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage="감사 이벤트가 없습니다"
      />
    </div>
  );
}
