import { useState } from 'react';
import { format } from 'date-fns';
import { useBatchJobExecutions } from '../../hooks/queries';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

const JOB_OPTIONS = [
  { value: 'eodSettlementJob', label: 'EOD 정산' },
  { value: 'reconciliationJob', label: '대사' },
];

export default function BatchJobsPage() {
  const [jobName, setJobName] = useState('eodSettlementJob');
  const [page, setPage] = useState(0);
  const { data, isLoading } = useBatchJobExecutions(jobName, page);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">배치 모니터링</h2>
        <p className="text-sm text-gray-400 mt-1">배치 Job 실행 이력을 확인합니다</p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {JOB_OPTIONS.map((job) => (
          <button
            key={job.value}
            onClick={() => { setJobName(job.value); setPage(0); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              jobName === job.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {job.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={[
          {
            key: 'status',
            header: '상태',
            render: (item) => <StatusBadge status={item.status} type="batch" />,
          },
          {
            key: 'jobName',
            header: 'Job',
            render: (item) => <span className="font-mono text-xs">{item.jobName}</span>,
          },
          {
            key: 'startTime',
            header: '시작',
            render: (item) =>
              item.startTime ? format(new Date(item.startTime), 'yyyy.MM.dd HH:mm:ss') : '-',
          },
          {
            key: 'endTime',
            header: '종료',
            render: (item) =>
              item.endTime ? format(new Date(item.endTime), 'yyyy.MM.dd HH:mm:ss') : '-',
          },
          {
            key: 'exitDescription',
            header: '설명',
            render: (item) => (
              <span className={`text-xs ${item.exitDescription ? 'text-red-500' : 'text-gray-400'}`}>
                {item.exitDescription || '-'}
              </span>
            ),
          },
        ]}
        data={data?.content || []}
        page={page}
        totalPages={data?.totalPages || 0}
        totalElements={data?.totalElements || 0}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage="실행 이력이 없습니다"
      />
    </div>
  );
}
