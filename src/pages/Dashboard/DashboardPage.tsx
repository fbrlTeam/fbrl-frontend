import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, isSameDay } from 'date-fns';
import {
  ShieldCheck,
  ShieldAlert,
  Calendar,
  RefreshCcw,
  ChevronRight,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Inbox,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  usePendingApprovals,
  useAuditEvents,
  useBatchJobExecutions,
  useSearchApprovals,
  useReconciliationDiscrepancies,
  useAuditVerifyStatus,
} from '../../hooks/queries';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';

const SERIES = {
  navy: '#16509f',
  amber: '#d97706',
  emerald: '#059669',
  red: '#dc2626',
  gray: '#cbd5e1',
};

function buildDailyTrend(createdAts: string[], days: number) {
  const now = new Date();
  const buckets: { date: string; label: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(now, i);
    buckets.push({ date: format(d, 'yyyy-MM-dd'), label: format(d, 'MM/dd'), count: 0 });
  }
  const map = new Map(buckets.map((b) => [b.date, b]));
  createdAts.forEach((iso) => {
    const bucket = map.get(format(new Date(iso), 'yyyy-MM-dd'));
    if (bucket) bucket.count += 1;
  });
  return buckets;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [trendRange, setTrendRange] = useState<7 | 14 | 30>(14);

  const now = new Date();
  const from30 = format(subDays(now, 30), "yyyy-MM-dd'T'00:00:00.000'Z'");
  const to30 = format(now, "yyyy-MM-dd'T'23:59:59.999'Z'");

  const { data: pending } = usePendingApprovals();
  const { data: auditData } = useAuditEvents(0, 200);
  const { data: eodBatch } = useBatchJobExecutions('eodSettlementJob', 0, 1);
  const { data: reconBatch } = useBatchJobExecutions('reconciliationJob', 0, 1);
  const { data: chainStatus } = useAuditVerifyStatus();
  const { data: approvalsHistory } = useSearchApprovals(from30, to30, undefined, 0, 200);
  const { data: reconData } = useReconciliationDiscrepancies(
    format(subDays(now, 30), 'yyyy-MM-dd'),
    format(now, 'yyyy-MM-dd'),
    undefined,
    0,
    200
  );

  const latestEod = eodBatch?.content?.[0];
  const latestRecon = reconBatch?.content?.[0];

  const recentEvents = useMemo(
    () => (auditData?.content ? [...auditData.content].reverse().slice(0, 5) : []),
    [auditData]
  );
  const trend = useMemo(
    () => buildDailyTrend((auditData?.content ?? []).map((e) => e.createdAt), trendRange),
    [auditData, trendRange]
  );

  const approvalItems = approvalsHistory?.content ?? [];
  const exec = {
    EXECUTED: approvalItems.filter((a) => a.executionStatus === 'EXECUTED').length,
    FAILED: approvalItems.filter((a) => a.executionStatus === 'FAILED').length,
    NA: approvalItems.filter((a) => a.executionStatus === 'NOT_APPLICABLE').length,
  };
  const todayDecided = approvalItems.filter(
    (a) => a.decidedAt && isSameDay(new Date(a.decidedAt), now)
  ).length;

  const reconItems = reconData?.content ?? [];
  const mismatchCount = reconItems.filter((r) => r.status === 'MISMATCH').length;
  const noSnapshotCount = reconItems.filter((r) => r.status === 'NO_SNAPSHOT').length;

  const approvalPie = [
    { key: 'PENDING', label: '결재 대기', value: approvalItems.filter((a) => a.status === 'PENDING').length, color: SERIES.amber },
    { key: 'APPROVED', label: '승인', value: approvalItems.filter((a) => a.status === 'APPROVED').length, color: SERIES.emerald },
    { key: 'REJECTED', label: '반려', value: approvalItems.filter((a) => a.status === 'REJECTED').length, color: SERIES.red },
  ].filter((d) => d.value > 0);

  const reconPie = [
    { key: 'MISMATCH', label: '불일치', value: mismatchCount, color: SERIES.red },
    { key: 'NO_SNAPSHOT', label: '스냅샷 없음', value: noSnapshotCount, color: SERIES.amber },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <PageHeader
        title="대시보드"
        description="거래·정산·감사 전 영역의 운영 현황"
        actions={
          <span className="flex items-center gap-1.5 text-[11.5px] text-ink-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {format(now, 'yyyy.MM.dd HH:mm')} 기준
          </span>
        }
      />

      {/* 핵심 지표 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <button onClick={() => navigate('/approvals')} className="panel p-4 text-left hover:border-navy-200 transition-colors duration-150 group">
          <div className="flex items-center justify-between">
            <span className="field-label">결재 대기</span>
            <ChevronRight size={14} className="text-ink-300 group-hover:text-navy-500 transition-colors" />
          </div>
          <p className="text-[26px] font-bold text-ink-900 tnum mt-2 leading-none">
            {pending?.length ?? '—'}
            <span className="text-[13px] font-medium text-ink-400 ml-1">건</span>
          </p>
          <p className="text-[11px] text-ink-400 mt-2">기준 금액 초과 이체</p>
        </button>

        <button onClick={() => navigate('/audit-log')} className="panel p-4 text-left hover:border-navy-200 transition-colors duration-150 group">
          <div className="flex items-center justify-between">
            <span className="field-label">감사 체인 무결성</span>
            <ChevronRight size={14} className="text-ink-300 group-hover:text-navy-500 transition-colors" />
          </div>
          <div className="flex items-center gap-2 mt-2.5">
            {chainStatus?.valid === false ? (
              <ShieldAlert size={19} className="text-red-500" />
            ) : (
              <ShieldCheck size={19} className="text-emerald-600" />
            )}
            <span className={`text-[17px] font-bold ${chainStatus?.valid === false ? 'text-red-600' : 'text-ink-900'}`}>
              {chainStatus ? (chainStatus.valid ? '정상' : '위변조 감지') : '—'}
            </span>
          </div>
          <p className="text-[11px] text-ink-400 mt-2 tnum">
            {chainStatus ? `${chainStatus.totalEntries.toLocaleString()}건 연결 검증` : '검증 대기'}
          </p>
        </button>

        <div className="panel p-4">
          <div className="flex items-center justify-between">
            <span className="field-label">EOD 정산 배치</span>
            <Calendar size={14} className="text-ink-300" />
          </div>
          <div className="mt-2.5">
            <StatusBadge status={latestEod?.status ?? '—'} type="batch" />
          </div>
          <p className="text-[11px] text-ink-400 mt-2 tnum">
            {latestEod?.startTime ? format(new Date(latestEod.startTime), 'MM.dd HH:mm 실행') : '실행 이력 없음'}
          </p>
        </div>

        <div className="panel p-4">
          <div className="flex items-center justify-between">
            <span className="field-label">대사 배치</span>
            <RefreshCcw size={14} className="text-ink-300" />
          </div>
          <div className="mt-2.5">
            <StatusBadge status={latestRecon?.status ?? '—'} type="batch" />
          </div>
          <p className="text-[11px] text-ink-400 mt-2 tnum">
            {latestRecon?.startTime ? format(new Date(latestRecon.startTime), 'MM.dd HH:mm 실행') : '실행 이력 없음'}
          </p>
        </div>
      </div>

      {/* 집행 현황 + 추이 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">자금 집행 현황</span>
            <span className="text-[10.5px] text-ink-400">최근 30일</span>
          </div>
          <div className="p-5">
            <p className="text-[28px] font-bold text-ink-900 tnum leading-none">
              {exec.EXECUTED + exec.FAILED}
              <span className="text-[13px] font-medium text-ink-400 ml-1">건</span>
            </p>
            <p className="text-[11px] text-ink-400 mt-1.5 mb-5">승인 후 집행 시도</p>

            <dl className="space-y-2.5">
              <ExecRow icon={<CheckCircle2 size={13} className="text-emerald-600" />} label="집행 완료" value={exec.EXECUTED} />
              <ExecRow icon={<XCircle size={13} className="text-red-500" />} label="집행 실패" value={exec.FAILED} />
              <ExecRow icon={<MinusCircle size={13} className="text-ink-300" />} label="해당 없음" value={exec.NA} />
            </dl>

            <p className="text-[10.5px] text-ink-400 leading-relaxed mt-5 pt-4 border-t border-line-soft">
              승인 행위와 자금 이동은 별개로 기록됩니다 — 승인 후에도 이상거래 탐지 등으로 집행이 실패할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="panel lg:col-span-2">
          <div className="panel-head">
            <div>
              <span className="panel-title">일별 트랜잭션 이벤트</span>
              <p className="text-[10.5px] text-ink-400 mt-0.5">Outbox 감사 이벤트 발생 건수</p>
            </div>
            <div className="segmented">
              {([7, 14, 30] as const).map((r) => (
                <button key={r} data-active={trendRange === r} onClick={() => setTrendRange(r)}>
                  {r}일
                </button>
              ))}
            </div>
          </div>
          <div className="p-5 pl-2">
            <ResponsiveContainer width="100%" height={218}>
              <BarChart data={trend} barCategoryGap={7}>
                <CartesianGrid vertical={false} stroke="#eef1f6" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10.5, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#e3e8ef' }}
                  tickLine={false}
                  interval={trendRange === 30 ? 3 : trendRange === 14 ? 1 : 0}
                />
                <YAxis
                  tick={{ fontSize: 10.5, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={30}
                />
                <Tooltip
                  cursor={{ fill: '#f4f6f9' }}
                  contentStyle={{
                    borderRadius: 6,
                    border: '1px solid #e3e8ef',
                    boxShadow: '0 4px 14px rgb(15 23 42 / 0.07)',
                    fontSize: 11.5,
                    padding: '7px 10px',
                  }}
                  labelStyle={{ color: '#0f172a', fontWeight: 600, marginBottom: 2 }}
                  formatter={(value) => [`${value ?? 0}건`, '이벤트']}
                />
                <Bar dataKey="count" fill={SERIES.navy} radius={[3, 3, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 분포 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <DonutPanel
          title="승인 상태 분포"
          caption="최근 30일 기안 건"
          total={approvalItems.length}
          data={approvalPie}
          empty="기안된 승인 요청이 없습니다"
        />
        <DonutPanel
          title="대사 불일치 유형"
          caption="최근 30일 검증 결과"
          total={mismatchCount + noSnapshotCount}
          data={reconPie}
          empty="대사 불일치가 없습니다"
        />
      </div>

      {/* 처리 대기 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">결재 대기 목록</span>
            <button onClick={() => navigate('/approvals')} className="text-[11.5px] text-navy-500 hover:text-navy-700 font-medium">
              전체보기
            </button>
          </div>
          {!pending || pending.length === 0 ? (
            <EmptyRow message="처리할 결재 건이 없습니다" />
          ) : (
            <div className="divide-y divide-line-soft">
              {pending.slice(0, 4).map((item) => (
                <button
                  key={item.requestId}
                  onClick={() => navigate(`/approvals/${item.requestId}`)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-navy-50/40 transition-colors duration-100 text-left"
                >
                  <div className="min-w-0">
                    <p className="text-[12.5px] text-ink-900 font-medium mono truncate">
                      {item.fromAccountNumber} → {item.toAccountNumber}
                    </p>
                    <p className="text-[11px] text-ink-400 mt-0.5">
                      기안 {item.makerId} · {format(new Date(item.requestedAt), 'MM.dd HH:mm')}
                    </p>
                  </div>
                  <span className="text-[13px] font-semibold text-ink-900 tnum shrink-0">
                    {Number(item.amount).toLocaleString()}원
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">최근 감사 이벤트</span>
            <button onClick={() => navigate('/audit-log')} className="text-[11.5px] text-navy-500 hover:text-navy-700 font-medium">
              전체보기
            </button>
          </div>
          {recentEvents.length === 0 ? (
            <EmptyRow message="기록된 이벤트가 없습니다" />
          ) : (
            <div className="divide-y divide-line-soft">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-[12px] text-ink-800 font-semibold">{event.eventType}</p>
                    <p className="text-[11px] text-ink-400 mono mt-0.5 truncate">
                      {event.aggregateType} · {event.aggregateId}
                    </p>
                  </div>
                  <span className="text-[11px] text-ink-400 tnum shrink-0">
                    {format(new Date(event.createdAt), 'MM.dd HH:mm:ss')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-ink-400 text-right mt-4 tnum">
        오늘 결재 처리 {todayDecided}건
      </p>
    </div>
  );
}

function ExecRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="flex items-center gap-2 text-[12px] text-ink-600">
        {icon}
        {label}
      </dt>
      <dd className="text-[12.5px] font-semibold text-ink-900 tnum">{value.toLocaleString()}건</dd>
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div className="py-11 text-center">
      <Inbox size={20} className="text-ink-200 mx-auto mb-2" />
      <p className="text-[12.5px] text-ink-400">{message}</p>
    </div>
  );
}

function DonutPanel({
  title,
  caption,
  total,
  data,
  empty,
}: {
  title: string;
  caption: string;
  total: number;
  data: { key: string; label: string; value: number; color: string }[];
  empty: string;
}) {
  const sum = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">{title}</span>
        <span className="text-[10.5px] text-ink-400">{caption}</span>
      </div>

      {sum === 0 ? (
        <EmptyRow message={empty} />
      ) : (
        <div className="flex items-center gap-5 p-5">
          <div className="relative w-[132px] h-[132px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={40}
                  outerRadius={62}
                  paddingAngle={2}
                  strokeWidth={2}
                  stroke="#ffffff"
                >
                  {data.map((d) => (
                    <Cell key={d.key} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 6, border: '1px solid #e3e8ef', fontSize: 11.5, padding: '6px 9px' }}
                  formatter={(value, name) => [`${value ?? 0}건`, name ?? '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-ink-400">전체</span>
              <span className="text-[15px] font-bold text-ink-900 tnum">{total.toLocaleString()}건</span>
            </div>
          </div>

          <dl className="flex-1 space-y-2.5 min-w-0">
            {data.map((d) => {
              const pct = sum > 0 ? Math.round((d.value / sum) * 100) : 0;
              return (
                <div key={d.key} className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-[12px] text-ink-600 truncate">{d.label}</span>
                  </dt>
                  <dd className="text-[11.5px] text-ink-500 shrink-0 tnum">
                    <span className="font-semibold text-ink-800">{d.value.toLocaleString()}</span>건 · {pct}%
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}
    </div>
  );
}
