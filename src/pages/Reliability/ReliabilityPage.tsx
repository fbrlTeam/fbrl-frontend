import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import {
  Lock,
  Fingerprint,
  Search,
  BookOpen,
  Link2,
  Radio,
  CircleCheck,
  CircleSlash,
  TriangleAlert,
  Minus,
  ArrowUpRight,
} from 'lucide-react';
import {
  useAuditVerifyStatus,
  useAuditEvents,
  useSearchApprovals,
  useBatchJobExecutions,
  useReconciliationDiscrepancies,
} from '../../hooks/queries';

/* ── 상태 체계 ─────────────────────────────────────────────
   live   : 이 콘솔에서 실데이터로 동작을 확인할 수 있음
   nodata : 백엔드에서 동작하지만 조회 API가 없어 화면 표현 불가
   gap    : 구현되어 있으나 실제 요청 경로에 연결되지 않음
   scope  : 이 리포지토리 범위 밖
   ────────────────────────────────────────────────────────── */
type MechState = 'live' | 'nodata' | 'gap' | 'scope';

const STATE_META: Record<
  MechState,
  { label: string; dot: string; chip: string; icon: React.ReactNode }
> = {
  live: {
    label: '실시간 확인',
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-700',
    icon: <CircleCheck size={12} />,
  },
  nodata: {
    label: '조회 API 없음',
    dot: 'bg-slate-300',
    chip: 'bg-slate-100 text-slate-600',
    icon: <CircleSlash size={12} />,
  },
  gap: {
    label: '경로 미연결',
    dot: 'bg-amber-500',
    chip: 'bg-amber-50 text-amber-700',
    icon: <TriangleAlert size={12} />,
  },
  scope: {
    label: '범위 밖',
    dot: 'bg-slate-200',
    chip: 'bg-slate-50 text-slate-400',
    icon: <Minus size={12} />,
  },
};

interface Mechanism {
  name: string;
  ref: string;
  state: MechState;
  detail: string;
  evidence?: string;
  href?: string;
}

/* 파이프라인 노드 — 이체 1건이 통과하는 신뢰성 게이트 */
const GATES = [
  { icon: Fingerprint, label: '멱등성', ref: '@CheckIdempotency', state: 'live' as MechState },
  { icon: Lock, label: '분산 락', ref: '@DistributedLock', state: 'nodata' as MechState },
  { icon: Search, label: '이상거래 탐지', ref: 'FraudCheckPort', state: 'nodata' as MechState },
  { icon: BookOpen, label: '복식부기 원장', ref: 'LedgerEntry', state: 'live' as MechState },
  { icon: Link2, label: 'Outbox 해시체인', ref: 'SHA-256', state: 'live' as MechState },
  { icon: Radio, label: 'CDC → Kafka', ref: 'Debezium WAL', state: 'nodata' as MechState },
];

export default function ReliabilityPage() {
  const navigate = useNavigate();
  const now = new Date();

  const { data: chain } = useAuditVerifyStatus();
  const { data: auditData } = useAuditEvents(0, 200);
  const { data: approvals } = useSearchApprovals(
    format(subDays(now, 30), "yyyy-MM-dd'T'00:00:00.000'Z'"),
    format(now, "yyyy-MM-dd'T'23:59:59.999'Z'"),
    undefined,
    0,
    200
  );
  const { data: eodBatch } = useBatchJobExecutions('eodSettlementJob', 0, 20);
  const { data: reconBatch } = useBatchJobExecutions('reconciliationJob', 0, 20);
  const { data: recon } = useReconciliationDiscrepancies(
    format(subDays(now, 30), 'yyyy-MM-dd'),
    format(now, 'yyyy-MM-dd'),
    undefined,
    0,
    200
  );

  const events = auditData?.content ?? [];
  const tracedCount = events.filter((e) => !!e.traceId).length;
  const approvalItems = approvals?.content ?? [];
  const decided = approvalItems.filter((a) => a.status !== 'PENDING').length;
  const batchRuns = (eodBatch?.totalElements ?? 0) + (reconBatch?.totalElements ?? 0);

  const tracks: { no: number; title: string; caption: string; items: Mechanism[] }[] = useMemo(
    () => [
      {
        no: 1,
        title: '실시간 트랜잭션 & 분산 동시성 제어',
        caption: '이체 1건이 통과하는 게이트들',
        items: [
          {
            name: 'API 멱등성',
            ref: '@CheckIdempotency · Redis SETNX',
            state: 'live',
            detail:
              '같은 요청이 두 번 들어와도 자금이 두 번 움직이지 않도록 요청마다 고유 키를 발급해 중복을 차단합니다.',
            evidence: '이 콘솔의 모든 이체 요청에 X-Idempotency-Key 전송 중',
            href: '/transfer',
          },
          {
            name: '해시체인 불변 감사로그',
            ref: 'OutboxEvent · SHA-256',
            state: 'live',
            detail:
              '각 이벤트가 직전 이벤트의 해시를 품어, 과거 기록을 하나라도 고치면 그 뒤 연결이 전부 끊깁니다.',
            evidence: chain
              ? `${chain.totalEntries.toLocaleString()}건 체인 · ${chain.valid ? '무결성 정상' : `ID ${chain.brokenAtId}에서 위변조 감지`}`
              : '검증 대기 중',
            href: '/audit-log',
          },
          {
            name: '복식부기 원장',
            ref: 'LedgerEntry · append-only',
            state: 'live',
            detail:
              '잔액을 필드에 저장하지 않고 원장 합산으로 파생시킵니다. 거래 단위 대차평형이 구조적으로 보장됩니다.',
            evidence: '계좌 상세에서 차변/대변 원장 전량 조회 가능',
            href: '/accounts',
          },
          {
            name: 'Maker-Checker 이중 승인',
            ref: '4-eyes principle',
            state: 'live',
            detail:
              '기준 금액 이상 이체는 즉시 차단되고, 기안자와 승인자가 반드시 달라야 집행이 시작됩니다. 승인 결과와 집행 결과는 별도 필드로 분리됩니다.',
            evidence: `최근 30일 ${approvalItems.length}건 기안 · ${decided}건 결재 완료`,
            href: '/approvals',
          },
          {
            name: '분산 트레이싱',
            ref: 'trace_id · OpenTelemetry',
            state: 'live',
            detail:
              'HTTP 요청부터 Outbox 저장, CDC, Kafka Consumer까지 하나의 trace_id로 연결됩니다. Jaeger UI에서 전체 스팬을 볼 수 있습니다.',
            evidence: `감사 이벤트 ${tracedCount}/${events.length}건에 trace_id 부착됨`,
            href: '/audit-log',
          },
          {
            name: 'Redisson 분산 락',
            ref: '@DistributedLock · REQUIRES_NEW',
            state: 'nodata',
            detail:
              '동일 계좌에 대한 동시 이체를 직렬화합니다. 락 획득/해제는 Redis에서 일어나며 요청 성공 여부로만 간접 관측됩니다.',
            evidence: '락 상태를 반환하는 조회 API가 없어 화면 표현 불가',
          },
          {
            name: 'Transactional Outbox + CDC',
            ref: 'Debezium · PostgreSQL WAL',
            state: 'nodata',
            detail:
              '폴링 없이 WAL 논리적 복제로 Kafka에 발행합니다. Outbox 저장까지는 감사 로그로 확인되지만 발행 단계는 보이지 않습니다.',
            evidence: 'Kafka Connect 커넥터 상태 조회 API 없음',
          },
          {
            name: '룰 기반 이상거래 탐지',
            ref: 'FraudCheckPort',
            state: 'nodata',
            detail:
              '단건 금액이 기준을 넘으면 이체를 즉시 차단합니다. 직접 이체와 승인 후 집행 두 경로 모두에 우회 없이 적용됩니다.',
            evidence: '차단 이력을 남기는 테이블/API가 없어 에러 응답으로만 관측',
          },
          {
            name: 'Saga 오케스트레이션',
            ref: 'TransferSaga · 보상 트랜잭션',
            state: 'gap',
            detail:
              '상태 머신과 보상 트랜잭션이 구현되어 있으나, 실제 이체 경로가 이를 호출하지 않습니다.',
            evidence: 'TransferSagaOrchestrator 호출부가 테스트 코드뿐 · transfer_sagas 0행',
          },
        ],
      },
      {
        no: 2,
        title: 'EOD 대규모 정산 배치',
        caption: '마감과 대사',
        items: [
          {
            name: 'EOD 정산 배치',
            ref: 'Spring Batch · Chunk-oriented',
            state: 'live',
            detail:
              '계좌별 일할 이자를 계산하고 마감 스냅샷을 저장합니다. 실행 이력과 실패 스택트레이스를 확인할 수 있습니다.',
            evidence: `누적 ${batchRuns}회 실행 이력 조회 가능`,
            href: '/batch-jobs',
          },
          {
            name: '대사(Reconciliation) 엔진',
            ref: 'EodSnapshot ↔ LedgerEntry',
            state: 'live',
            detail:
              '마감 스냅샷과 원장 전량 재계산 결과를 계좌 단위로 대조해 MISMATCH / NO_SNAPSHOT을 기록합니다.',
            evidence: `최근 30일 불일치 ${(recon?.totalElements ?? 0).toLocaleString()}건 기록됨`,
            href: '/reconciliation',
          },
          {
            name: '대차평형 검증 스텝',
            ref: 'trialBalanceVerificationStep',
            state: 'nodata',
            detail:
              '매일 마감 시 전체 원장의 차변/대변 합을 대조해 불일치 시 배치를 실패시킵니다. 시스템 전체 SUM=0 검증입니다.',
            evidence: '배치 API가 Job 단위만 반환 — 스텝 단위 실행 결과가 노출되지 않음',
          },
          {
            name: 'ShedLock 중복 실행 방지',
            ref: 'ShedLock · Redis',
            state: 'nodata',
            detail:
              '다중 인스턴스에서 스케줄러가 동시에 뜨더라도 배치가 한 번만 실행되도록 잠급니다.',
            evidence: '락 키가 Redis에만 존재 · 조회 API 없음',
          },
          {
            name: 'Kubernetes Lease 리더 선출',
            ref: 'k8s.leader-election.enabled',
            state: 'scope',
            detail:
              'Lease API로 리더를 선출해 단일 인스턴스만 배치를 트리거합니다. 로컬 환경에서는 기본 비활성화입니다.',
            evidence: 'kind 클러스터 + RBAC 매니페스트 적용 시에만 동작',
          },
        ],
      },
      {
        no: 3,
        title: '장애 복구 & 복원력',
        caption: '실패했을 때의 거동',
        items: [
          {
            name: 'Kafka 재시도 토픽 + DLT',
            ref: 'Non-blocking Retry',
            state: 'nodata',
            detail:
              '일시적 실패는 지수 백오프로 재시도하고, 결정론적 실패는 즉시 DLT로 보냅니다.',
            evidence: '재시도/DLT 적재 현황을 반환하는 API 없음 — Kafka에서 직접 확인 필요',
          },
          {
            name: 'Chaos Mesh 결함 주입',
            ref: 'Infra 담당 영역',
            state: 'scope',
            detail:
              '장애 시나리오 주입은 인프라 리포지토리 소관입니다. 백엔드는 주입 후 애플리케이션 반응 검증을 담당합니다.',
            evidence: '이 리포지토리 범위 밖',
          },
        ],
      },
    ],
    [chain, approvalItems.length, decided, tracedCount, events.length, batchRuns, recon]
  );

  const all = tracks.flatMap((t) => t.items);
  const counts = {
    live: all.filter((m) => m.state === 'live').length,
    nodata: all.filter((m) => m.state === 'nodata').length,
    gap: all.filter((m) => m.state === 'gap').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink-900">신뢰성 메커니즘</h2>
        <p className="text-sm text-ink-400 mt-1">
          백엔드가 구현한 금융 신뢰성 패턴이 이 콘솔에서 어디까지 관측되는지 정리합니다
        </p>
      </div>

      {/* 커버리지 요약 */}
      <div className="grid grid-cols-3 gap-4">
        <CoverageTile
          value={counts.live}
          total={all.length}
          label="실시간 확인 가능"
          caption="실데이터로 동작 확인"
          tone="emerald"
        />
        <CoverageTile
          value={counts.nodata}
          total={all.length}
          label="조회 API 없음"
          caption="동작하지만 화면 표현 불가"
          tone="slate"
        />
        <CoverageTile
          value={counts.gap}
          total={all.length}
          label="경로 미연결"
          caption="구현됐으나 호출되지 않음"
          tone="amber"
        />
      </div>

      {/* 파이프라인 */}
      <div className="panel p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-ink-900">이체 1건이 통과하는 신뢰성 게이트</h3>
          <span className="text-[11px] text-ink-400">POST /api/v1/transfers</span>
        </div>
        <p className="text-[11px] text-ink-400 mb-5">
          기준 금액을 넘으면 이 파이프라인에 진입하기 전에 Maker-Checker 결재로 분기합니다
        </p>

        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex items-stretch gap-0 min-w-[860px]">
            {GATES.map((gate, i) => (
              <div key={gate.label} className="flex items-stretch flex-1">
                <div className="flex-1 rounded-md border border-line bg-canvas p-3.5 relative">
                  <span
                    className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full ${STATE_META[gate.state].dot}`}
                  />
                  <gate.icon size={16} className="text-ink-400 mb-2.5" />
                  <p className="text-xs font-semibold text-ink-800 leading-tight">{gate.label}</p>
                  <p className="text-[10px] text-ink-400 mono mt-1 truncate">{gate.ref}</p>
                </div>
                {i < GATES.length - 1 && (
                  <div className="flex items-center px-1.5 shrink-0">
                    <svg width="16" height="8" viewBox="0 0 16 8" fill="none">
                      <path
                        d="M0 4h11"
                        stroke="#cbd5e1"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        className="pipeline-flow"
                      />
                      <path d="M10 1l4 3-4 3" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-line-soft">
          {(['live', 'nodata'] as const).map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-[11px] text-ink-400">
              <span className={`w-1.5 h-1.5 rounded-full ${STATE_META[s].dot}`} />
              {STATE_META[s].label}
            </span>
          ))}
        </div>
      </div>

      {/* 트랙별 메커니즘 */}
      {tracks.map((track) => (
        <div key={track.no} className="space-y-3">
          <div className="flex items-baseline gap-2.5 pt-1">
            <span className="text-[11px] font-bold text-navy-600 tracking-wide">TRACK {track.no}</span>
            <h3 className="text-sm font-semibold text-ink-900">{track.title}</h3>
            <span className="text-[11px] text-ink-400">{track.caption}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {track.items.map((m) => (
              <MechanismCard key={m.name} mech={m} onNavigate={navigate} />
            ))}
          </div>
        </div>
      ))}

      <style>{`
        @keyframes pipelineFlow { to { stroke-dashoffset: -12; } }
        .pipeline-flow { animation: pipelineFlow 1.2s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .pipeline-flow { animation: none; } }
      `}</style>
    </div>
  );
}

function CoverageTile({
  value,
  total,
  label,
  caption,
  tone,
}: {
  value: number;
  total: number;
  label: string;
  caption: string;
  tone: 'emerald' | 'slate' | 'amber';
}) {
  const bar = {
    emerald: 'bg-emerald-500',
    slate: 'bg-slate-300',
    amber: 'bg-amber-500',
  }[tone];
  const pct = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="panel p-5">
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-ink-900">{value}</span>
        <span className="text-xs text-ink-300">/ {total}</span>
      </div>
      <p className="text-xs font-medium text-ink-600 mt-1">{label}</p>
      <p className="text-[11px] text-ink-400 mt-0.5">{caption}</p>
      <div className="mt-3 h-1 rounded-full bg-ink-200 overflow-hidden">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MechanismCard({
  mech,
  onNavigate,
}: {
  mech: Mechanism;
  onNavigate: (to: string) => void;
}) {
  const meta = STATE_META[mech.state];
  const dimmed = mech.state === 'nodata' || mech.state === 'scope';

  return (
    <div
      className={`panel border p-5 flex flex-col ${
        mech.state === 'gap' ? 'border-l-[3px] border-l-amber-500 border-line bg-white' : 'border-line bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${dimmed ? 'text-ink-500' : 'text-ink-900'}`}>
            {mech.name}
          </p>
          <p className="text-[11px] text-ink-400 mono mt-0.5 truncate">{mech.ref}</p>
        </div>
        <span
          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md shrink-0 ${meta.chip}`}
        >
          {meta.icon}
          {meta.label}
        </span>
      </div>

      <p className="text-xs text-ink-500 leading-relaxed mt-3">{mech.detail}</p>

      {mech.evidence && (
        <div className="mt-3 pt-3 border-t border-line-soft flex items-center justify-between gap-3">
          <p
            className={`text-[11px] ${
              mech.state === 'live' ? 'text-emerald-700' : 'text-ink-400'
            }`}
          >
            {mech.evidence}
          </p>
          {mech.href && (
            <button
              onClick={() => onNavigate(mech.href!)}
              className="flex items-center gap-0.5 text-[11px] text-navy-500 hover:text-navy-700 shrink-0 transition-colors duration-150"
            >
              보기
              <ArrowUpRight size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
