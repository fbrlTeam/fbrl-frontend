import { useState } from 'react';
import { format, subDays } from 'date-fns';
import {
  CheckCircle2,
  XCircle,
  Calendar,
  RefreshCcw,
  FileWarning,
  Lock,
  AlertTriangle,
  Scale,
  HelpCircle,
} from 'lucide-react';
import {
  useDemoBatchJobExecutions,
  useTriggerDemoEod,
  useTriggerDemoReconciliation,
  useDemoEodSnapshotsByDate,
  useDemoReconciliationDiscrepancies,
} from '../../hooks/queries';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import type { ReconciliationStatus } from '../../types/api';

const JOB_OPTIONS = [
  { value: 'demoEodSettlementJob', label: 'EOD 정산', icon: Calendar, desc: '계좌별 일할 이자 계산 및 마감 스냅샷 저장' },
  { value: 'demoReconciliationJob', label: '대사', icon: RefreshCcw, desc: '마감 스냅샷과 원장 재계산 결과 대조' },
];

type SubTab = 'executions' | 'eod' | 'reconciliation';

function durationOf(start?: string | null, end?: string | null) {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function extractErrorMessage(err: unknown, fallback: string) {
  const axiosErr = err as { response?: { status?: number; data?: { code?: string; message?: string } } };
  return axiosErr.response?.data?.message || fallback;
}

export default function DemoBatchPage() {
  const [subTab, setSubTab] = useState<SubTab>('executions');
  const [triggerResult, setTriggerResult] = useState<{ label: string; status: string } | null>(null);
  const [triggerError, setTriggerError] = useState('');

  const triggerEod = useTriggerDemoEod();
  const triggerReconciliation = useTriggerDemoReconciliation();

  const handleTriggerEod = async () => {
    setTriggerError('');
    setTriggerResult(null);
    try {
      const result = await triggerEod.mutateAsync();
      setTriggerResult({ label: 'EOD 정산', status: result.status });
    } catch (err) {
      setTriggerError(extractErrorMessage(err, 'EOD 정산 실행에 실패했습니다.'));
    }
  };

  const handleTriggerReconciliation = async () => {
    setTriggerError('');
    setTriggerResult(null);
    try {
      const result = await triggerReconciliation.mutateAsync();
      setTriggerResult({ label: '대사', status: result.status });
    } catch (err) {
      setTriggerError(extractErrorMessage(err, '대사 실행에 실패했습니다.'));
    }
  };

  return (
    <div>
      <PageHeader
        title="배치·정산"
        description="EOD 정산과 대사 배치를 직접 실행하고 결과를 확인합니다"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleTriggerEod} disabled={triggerEod.isPending} className="btn-secondary">
              <Calendar size={14} />
              EOD 실행
            </button>
            <button onClick={handleTriggerReconciliation} disabled={triggerReconciliation.isPending} className="btn-primary">
              <RefreshCcw size={14} />
              대사 실행
            </button>
          </div>
        }
      />

      {triggerResult && (
        <div
          className={`panel px-5 py-4 mb-4 flex items-center gap-3.5 border-l-[3px] ${
            triggerResult.status === 'COMPLETED' ? 'border-l-emerald-500' : 'border-l-red-500'
          }`}
        >
          {triggerResult.status === 'COMPLETED' ? (
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          ) : (
            <XCircle size={20} className="text-red-500 shrink-0" />
          )}
          <div>
            <p className={`text-[13px] font-semibold ${triggerResult.status === 'COMPLETED' ? 'text-emerald-700' : 'text-red-700'}`}>
              {triggerResult.label} Job {triggerResult.status === 'COMPLETED' ? '정상 종료' : `상태: ${triggerResult.status}`}
            </p>
            <p className="text-[11.5px] text-ink-500 mt-0.5">아래 실행 이력 탭에서 상세 로그를 확인할 수 있습니다.</p>
          </div>
        </div>
      )}

      {triggerError && (
        <div className="panel px-5 py-4 mb-4 flex items-start gap-3.5 border-l-[3px] border-l-amber-500">
          <Lock size={18} className="text-amber-500 shrink-0" />
          <p className="text-[12.5px] text-amber-800 leading-relaxed">{triggerError}</p>
        </div>
      )}

      <div className="segmented mb-4">
        <button data-active={subTab === 'executions'} onClick={() => setSubTab('executions')}>
          실행 이력
        </button>
        <button data-active={subTab === 'eod'} onClick={() => setSubTab('eod')}>
          EOD 스냅샷
        </button>
        <button data-active={subTab === 'reconciliation'} onClick={() => setSubTab('reconciliation')}>
          대사 결과
        </button>
      </div>

      {subTab === 'executions' && <ExecutionsTab />}
      {subTab === 'eod' && <EodSnapshotsTab />}
      {subTab === 'reconciliation' && <ReconciliationTab />}
    </div>
  );
}

function ExecutionsTab() {
  const [jobName, setJobName] = useState('demoEodSettlementJob');
  const [page, setPage] = useState(0);
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const { data, isLoading } = useDemoBatchJobExecutions(jobName, page);
  const items = data?.content || [];
  const current = JOB_OPTIONS.find((j) => j.value === jobName)!;

  const successCount = items.filter((i) => i.status === 'COMPLETED').length;
  const failCount = items.filter((i) => i.status === 'FAILED').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="segmented">
          {JOB_OPTIONS.map((job) => (
            <button
              key={job.value}
              data-active={jobName === job.value}
              onClick={() => {
                setJobName(job.value);
                setPage(0);
              }}
            >
              {job.label}
            </button>
          ))}
        </div>
      </div>

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
            <dd className={`text-[16px] font-bold tnum ${failCount > 0 ? 'text-red-600' : 'text-ink-300'}`}>{failCount}</dd>
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
          <p className="text-[13px] text-ink-400">실행 이력이 없습니다 — 위 버튼으로 직접 실행해보세요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => {
            const completed = item.status === 'COMPLETED';
            const duration = durationOf(item.startTime, item.endTime);
            return (
              <div key={idx} className={`panel px-5 py-4 border-l-[3px] ${completed ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
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
                      completed ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
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
                    <span className="text-[11.5px] text-red-700 mono truncate flex-1">{item.exitDescription.split('\n')[0]}</span>
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
            ‹
          </button>
          <span className="text-[11.5px] text-ink-600 px-2.5 min-w-[60px] text-center tnum">
            {page + 1} / {data?.totalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= (data?.totalPages || 0) - 1}
            className="w-7 h-7 flex items-center justify-center rounded border border-line bg-white text-ink-500 hover:text-ink-800 disabled:opacity-35 transition-colors duration-150"
          >
            ›
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

function EodSnapshotsTab() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [page, setPage] = useState(0);
  const { data, isLoading } = useDemoEodSnapshotsByDate(date, page);

  const rows = data?.content ?? [];
  const closingSum = rows.reduce((s, r) => s + Number(r.closingBalance), 0);
  const interestSum = rows.reduce((s, r) => s + Number(r.interestAmount), 0);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
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

      <div className="grid grid-cols-3 gap-3 mb-4">
        <SummaryTile label="스냅샷 계좌 수" value={(data?.totalElements ?? 0).toLocaleString()} unit="건" />
        <SummaryTile label="마감 잔액 합계" value={closingSum.toLocaleString()} unit="원" />
        <SummaryTile label="지급 이자 합계" value={interestSum.toLocaleString()} unit="원" accent />
      </div>

      <DataTable
        columns={[
          { key: 'accountNumber', header: '계좌번호', render: (item) => <span className="mono text-[12px] font-medium text-ink-800">{item.accountNumber}</span> },
          {
            key: 'closingBalance',
            header: '마감 잔액',
            align: 'right',
            render: (item) => <span className="font-semibold text-ink-900">{Number(item.closingBalance).toLocaleString()}원</span>,
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
          { key: 'settlementDate', header: '정산일', render: (item) => <span className="text-ink-600">{item.settlementDate}</span> },
          {
            key: 'computedAt',
            header: '계산일시',
            align: 'right',
            render: (item) => <span className="text-ink-500">{format(new Date(item.computedAt), 'yyyy.MM.dd HH:mm:ss')}</span>,
          },
        ]}
        data={rows}
        page={page}
        totalPages={data?.totalPages || 0}
        totalElements={data?.totalElements || 0}
        onPageChange={setPage}
        loading={isLoading}
        emptyMessage="해당 정산일에 생성된 EOD 스냅샷이 없습니다 — EOD 실행 버튼을 눌러 만들어보세요"
      />
    </div>
  );
}

function ReconciliationTab() {
  const now = new Date();
  const [from, setFrom] = useState(format(subDays(now, 30), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(now, 'yyyy-MM-dd'));
  const [status, setStatus] = useState<ReconciliationStatus | undefined>();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useDemoReconciliationDiscrepancies(from, to, status, page);
  const items = data?.content || [];

  const mismatchCount = items.filter((i) => i.status === 'MISMATCH').length;
  const noSnapshotCount = items.filter((i) => i.status === 'NO_SNAPSHOT').length;
  const totalDelta = items
    .filter((i) => i.status === 'MISMATCH' && i.expectedBalance !== null && i.actualBalance !== null)
    .reduce((sum, i) => sum + Math.abs(Number(i.actualBalance) - Number(i.expectedBalance)), 0);

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <SummaryTile label="불일치 (MISMATCH)" value={mismatchCount.toLocaleString()} unit="건" tone={mismatchCount > 0 ? 'red' : undefined} />
        <SummaryTile label="스냅샷 없음" value={noSnapshotCount.toLocaleString()} unit="건" tone={noSnapshotCount > 0 ? 'amber' : undefined} />
        <SummaryTile label="총 차액" value={totalDelta.toLocaleString()} unit="원" tone={totalDelta > 0 ? 'red' : undefined} />
      </div>

      <div className="panel px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
        <span className="field-label">정산일</span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(0);
            }}
            className="field w-auto h-8 text-[12px]"
          />
          <span className="text-[12px] text-ink-400">~</span>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(0);
            }}
            className="field w-auto h-8 text-[12px]"
          />
        </div>
        <span className="w-px h-5 bg-line ml-1" />
        <div className="segmented">
          {([undefined, 'MISMATCH', 'NO_SNAPSHOT'] as const).map((s) => (
            <button
              key={s ?? 'all'}
              data-active={status === s}
              onClick={() => {
                setStatus(s as ReconciliationStatus | undefined);
                setPage(0);
              }}
            >
              {s === undefined ? '전체' : s === 'MISMATCH' ? '불일치' : '스냅샷 없음'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="panel p-14 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-navy-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="panel p-14 text-center">
          <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2.5" />
          <p className="text-[13px] font-semibold text-ink-800">대차가 전부 일치합니다</p>
          <p className="text-[12px] text-ink-400 mt-1">해당 기간에 불일치가 발견되지 않았습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const isMismatch = item.status === 'MISMATCH';
            const delta =
              isMismatch && item.expectedBalance !== null && item.actualBalance !== null
                ? Number(item.actualBalance) - Number(item.expectedBalance)
                : null;

            return (
              <div key={item.id} className={`panel px-5 py-4 ${isMismatch ? 'border-l-[3px] border-l-red-500' : 'border-l-[3px] border-l-amber-500'}`}>
                <div className="flex items-center justify-between gap-5 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${isMismatch ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                      {isMismatch ? <AlertTriangle size={15} /> : <HelpCircle size={15} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-ink-900 mono">{item.accountNumber}</p>
                      <p className="text-[11px] text-ink-400 mt-0.5 tnum">
                        정산일 {item.settlementDate} · 검증 {format(new Date(item.computedAt), 'MM.dd HH:mm:ss')}
                      </p>
                    </div>
                  </div>

                  {isMismatch ? (
                    <div className="flex items-center gap-5">
                      <Figure label="기대 잔액" value={`${Number(item.expectedBalance).toLocaleString()}원`} />
                      <span className="text-ink-300 text-[13px]">→</span>
                      <Figure label="실제 잔액" value={`${Number(item.actualBalance).toLocaleString()}원`} strong />
                      {delta !== null && (
                        <div className="pl-5 border-l border-line">
                          <p className="text-[10px] text-red-400 text-right">차액</p>
                          <p className="text-[14px] font-bold text-red-600 tnum text-right">
                            {delta > 0 ? '+' : ''}
                            {delta.toLocaleString()}원
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-2 h-[22px] inline-flex items-center rounded">
                      EOD 스냅샷 미생성
                    </span>
                  )}
                </div>
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
            ‹
          </button>
          <span className="text-[11.5px] text-ink-600 px-2.5 min-w-[60px] text-center tnum">
            {page + 1} / {data?.totalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= (data?.totalPages || 0) - 1}
            className="w-7 h-7 flex items-center justify-center rounded border border-line bg-white text-ink-500 hover:text-ink-800 disabled:opacity-35 transition-colors duration-150"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

function Figure({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="text-right">
      <p className="text-[10px] text-ink-400">{label}</p>
      <p className={`text-[13px] tnum ${strong ? 'font-semibold text-ink-900' : 'font-medium text-ink-600'}`}>{value}</p>
    </div>
  );
}

function SummaryTile({ label, value, unit, accent, tone }: { label: string; value: string; unit: string; accent?: boolean; tone?: 'red' | 'amber' }) {
  const color = tone === 'red' ? 'text-red-600' : tone === 'amber' ? 'text-amber-600' : accent ? 'text-emerald-700' : 'text-ink-900';
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <span className="field-label">{label}</span>
        <Scale size={13} className="text-ink-300" />
      </div>
      <p className={`text-[22px] font-bold tnum mt-2 leading-none ${color}`}>
        {value}
        <span className="text-[12px] font-medium text-ink-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}
