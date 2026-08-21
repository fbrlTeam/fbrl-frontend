import { useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Calendar, RefreshCcw, FileWarning } from 'lucide-react';
import { useBatchJobExecutions } from '../../hooks/queries';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';

const JOB_OPTIONS = [
  { value: 'eodSettlementJob', label: 'EOD 정산', icon: Calendar, desc: '계좌별 일할 이자 계산 및 마감 스냅샷 저장' },
  { value: 'reconciliationJob', label: '대사', icon: RefreshCcw, desc: '마감 스냅샷과 원장 재계산 결과 대조' },
];

function durationOf(start?: string | null, end?: string | null) {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export default function BatchJobsPage() {
  const [jobName, setJobName] = useState('eodSettlementJob');
  const [page, setPage] = useState(0);
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const { data, isLoading } = useBatchJobExecutions(jobName, page);
  const items = data?.content || [];
  const current = JOB_OPTIONS.find((j) => j.value === jobName)!;

  const successCount = items.filter((i) => i.status === 'COMPLETED').length;
  const failCount = items.filter((i) => i.status === 'FAILED').length;

  return (
    <div>
      <PageHeader
        title="배치 모니터링"
        description="정산·대사 Job의 실행 이력과 실패 원인을 확인합니다"
        actions={
          <div className="segmented">
            {JOB_OPTIONS.map((job) => (
              <button
                key={job.value}
                data-active={jobName === job.value}
                onClick={() => { setJobName(job.value); setPage(0); }}
              >
                {job.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Job 요약 */}
      <div className="panel px-5 py-4 mb-4 flex items-center justify-between gap-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-navy-50 flex items-center justify-center">
            <current.icon size={17} className="text-navy-700" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-ink-900 mono">{current.value}</p>
            <p className="text-[11.5px] text-ink-500 mt-0.5">{current.desc}</p>
          </div>
        </div>
        <dl className="flex items-center gap-7">
          <div className="text-right">
            <dt className="text-[10.5px] text-ink-400">정상 종료</dt>
            <dd className="text-[16px] font-bold text-emerald-600 tnum">{successCount}</dd>
          </div>
          <div className="text-right">
            <dt className="text-[10.5px] text-ink-400">실패</dt>
            <dd className={`text-[16px] font-bold tnum ${failCount > 0 ? 'text-red-600' : 'text-ink-300'}`}>
              {failCount}
            </dd>
          </div>
          <div className="text-right pl-6 border-l border-line">
            <dt className="text-[10.5px] text-ink-400">누적 실행</dt>
            <dd className="text-[16px] font-bold text-ink-900 tnum">{data?.totalElements ?? 0}</dd>
          </div>
        </dl>
      </div>

      {isLoading ? (
        <div className="panel p-14 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-navy-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="panel p-14 text-center">
          <p className="text-[13px] text-ink-400">실행 이력이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => {
            const completed = item.status === 'COMPLETED';
            const duration = durationOf(item.startTime, item.endTime);
            return (
              <div
                key={idx}
                className={`panel px-5 py-4 border-l-[3px] ${completed ? 'border-l-emerald-500' : 'border-l-red-500'}`}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${completed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                      {completed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                    </div>
                    <div>
                      <p className="text-[12.5px] font-semibold text-ink-900 mono">{item.jobName}</p>
                      <p className="text-[11px] text-ink-400 mt-0.5 tnum">
                        {item.startTime ? format(new Date(item.startTime), 'yyyy.MM.dd HH:mm:ss') : '—'}
                        {duration && <span className="text-ink-300"> · 소요 {duration}</span>}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-semibold px-2 h-[22px] inline-flex items-center rounded border ${
                      completed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-red-50 text-red-700 border-red-100'
                    }`}
                  >
                    {completed ? '정상 종료' : '실패'}
                  </span>
                </div>

                {item.exitDescription && (
                  <button
                    onClick={() => setSelectedError(item.exitDescription)}
                    className="mt-3 w-full flex items-center gap-2 px-3 py-2 bg-red-50/60 border border-red-100 rounded text-left hover:bg-red-50 transition-colors duration-150"
                  >
                    <FileWarning size={13} className="text-red-500 shrink-0" />
                    <span className="text-[11.5px] text-red-700 mono truncate flex-1">
                      {item.exitDescription.split('\n')[0]}
                    </span>
                    <span className="text-[11px] text-red-400 shrink-0">전체 로그</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <span className="text-[11.5px] text-ink-500">
          전체 <span className="font-semibold text-ink-700 tnum">{(data?.totalElements ?? 0).toLocaleString()}</span>건
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className="w-7 h-7 flex items-center justify-center rounded border border-line bg-white text-ink-500 hover:text-ink-800 disabled:opacity-35 transition-colors duration-150"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[11.5px] text-ink-600 px-2.5 min-w-[60px] text-center tnum">
            {page + 1} / {data?.totalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= (data?.totalPages || 0) - 1}
            className="w-7 h-7 flex items-center justify-center rounded border border-line bg-white text-ink-500 hover:text-ink-800 disabled:opacity-35 transition-colors duration-150"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <Modal open={!!selectedError} onClose={() => setSelectedError(null)} title="배치 실패 상세 로그" size="lg">
        <pre className="text-[11px] text-ink-600 whitespace-pre-wrap break-all max-h-[58vh] overflow-y-auto mono bg-canvas border border-line rounded p-4 leading-relaxed">
          {selectedError}
        </pre>
      </Modal>
    </div>
  );
}
