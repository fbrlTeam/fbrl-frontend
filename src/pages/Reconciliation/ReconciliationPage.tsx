import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { AlertTriangle, HelpCircle, ChevronLeft, ChevronRight, Scale, CheckCircle2 } from 'lucide-react';
import { useReconciliationDiscrepancies } from '../../hooks/queries';
import PageHeader from '../../components/common/PageHeader';
import type { ReconciliationStatus } from '../../types/api';

export default function ReconciliationPage() {
  const now = new Date();
  const [from, setFrom] = useState(format(subDays(now, 30), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(now, 'yyyy-MM-dd'));
  const [status, setStatus] = useState<ReconciliationStatus | undefined>();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useReconciliationDiscrepancies(from, to, status, page);
  const items = data?.content || [];

  const mismatchCount = items.filter((i) => i.status === 'MISMATCH').length;
  const noSnapshotCount = items.filter((i) => i.status === 'NO_SNAPSHOT').length;
  const totalDelta = items
    .filter((i) => i.status === 'MISMATCH' && i.expectedBalance !== null && i.actualBalance !== null)
    .reduce((sum, i) => sum + Math.abs(Number(i.actualBalance) - Number(i.expectedBalance)), 0);

  return (
    <div>
      <PageHeader
        title="대사"
        description="EOD 마감 스냅샷과 원장 전량 재계산 결과를 계좌 단위로 대조합니다"
      />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <SummaryTile
          label="불일치 (MISMATCH)"
          value={mismatchCount.toLocaleString()}
          unit="건"
          caption="스냅샷과 재계산 잔액 상이"
          tone={mismatchCount > 0 ? 'red' : 'neutral'}
        />
        <SummaryTile
          label="스냅샷 없음"
          value={noSnapshotCount.toLocaleString()}
          unit="건"
          caption="대조할 마감 스냅샷 미생성"
          tone={noSnapshotCount > 0 ? 'amber' : 'neutral'}
        />
        <SummaryTile
          label="총 차액"
          value={totalDelta.toLocaleString()}
          unit="원"
          caption="불일치 건 절대값 합계"
          tone={totalDelta > 0 ? 'red' : 'neutral'}
        />
      </div>

      {/* 조회 조건 */}
      <div className="panel px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
        <span className="field-label">정산일</span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(0); }}
            className="field w-auto h-8 text-[12px]"
          />
          <span className="text-[12px] text-ink-400">~</span>
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(0); }}
            className="field w-auto h-8 text-[12px]"
          />
        </div>

        <span className="w-px h-5 bg-line ml-1" />

        <div className="segmented">
          {([undefined, 'MISMATCH', 'NO_SNAPSHOT'] as const).map((s) => (
            <button
              key={s ?? 'all'}
              data-active={status === s}
              onClick={() => { setStatus(s as ReconciliationStatus | undefined); setPage(0); }}
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
              <div
                key={item.id}
                className={`panel px-5 py-4 ${isMismatch ? 'border-l-[3px] border-l-red-500' : 'border-l-[3px] border-l-amber-500'}`}
              >
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
    </div>
  );
}

function Figure({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="text-right">
      <p className="text-[10px] text-ink-400">{label}</p>
      <p className={`text-[13px] tnum ${strong ? 'font-semibold text-ink-900' : 'font-medium text-ink-600'}`}>
        {value}
      </p>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  unit,
  caption,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  caption: string;
  tone: 'red' | 'amber' | 'neutral';
}) {
  const accent = {
    red: 'text-red-600',
    amber: 'text-amber-600',
    neutral: 'text-ink-900',
  }[tone];

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <span className="field-label">{label}</span>
        <Scale size={13} className="text-ink-300" />
      </div>
      <p className={`text-[24px] font-bold tnum mt-2 leading-none ${accent}`}>
        {value}
        <span className="text-[12px] font-medium text-ink-400 ml-1">{unit}</span>
      </p>
      <p className="text-[11px] text-ink-400 mt-2">{caption}</p>
    </div>
  );
}
