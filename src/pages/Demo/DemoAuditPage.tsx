import { useState } from 'react';
import { format } from 'date-fns';
import { ShieldCheck, CheckCircle2, XCircle, Link2, Unlink, Flag, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useDemoAuditEvents, useDemoAuditVerify } from '../../hooks/queries';
import PageHeader from '../../components/common/PageHeader';

const GENESIS_HASH = '0'.repeat(64);

function truncateHash(hash: string) {
  if (!hash || hash.length <= 20) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

export default function DemoAuditPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useDemoAuditEvents(page);
  const verifyMutation = useDemoAuditVerify();

  const events = data?.content || [];

  return (
    <div>
      <PageHeader
        title="감사로그"
        description="각 이벤트가 직전 이벤트의 해시를 포함합니다 — 하나라도 변조되면 그 뒤 연결이 전부 끊어집니다"
        actions={
          <button onClick={() => verifyMutation.mutate()} disabled={verifyMutation.isPending} className="btn-primary">
            <ShieldCheck size={15} />
            체인 무결성 검증
          </button>
        }
      />

      <div className="flex items-start gap-2.5 bg-navy-50 border border-navy-100 rounded p-3.5 mb-4">
        <Info size={14} className="text-navy-500 shrink-0 mt-px" />
        <p className="text-[11.5px] text-navy-700 leading-relaxed">
          데모 데이터는 초기화될 때마다 이벤트 하나를 일부러 변조합니다. 검증 버튼을 눌러 위변조가 실제로
          탐지되는 것을 확인해보세요.
        </p>
      </div>

      {verifyMutation.data && (
        <div
          className={`panel px-5 py-4 mb-4 flex items-center gap-3.5 border-l-[3px] ${
            verifyMutation.data.valid ? 'border-l-emerald-500' : 'border-l-red-500'
          }`}
        >
          {verifyMutation.data.valid ? (
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          ) : (
            <XCircle size={20} className="text-red-500 shrink-0" />
          )}
          <div>
            <p className={`text-[13px] font-semibold ${verifyMutation.data.valid ? 'text-emerald-700' : 'text-red-700'}`}>
              {verifyMutation.data.valid ? '무결성 검증 통과' : '무결성 검증 실패'}
            </p>
            <p className="text-[11.5px] text-ink-500 mt-0.5 tnum">
              총 {verifyMutation.data.totalEntries.toLocaleString()}건 연결 확인
              {verifyMutation.data.brokenAtId && ` · 손상 위치 ID ${verifyMutation.data.brokenAtId}`}
              {verifyMutation.data.reason && ` · ${verifyMutation.data.reason}`}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="panel p-14 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-navy-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="panel p-14 text-center">
          <p className="text-[13px] text-ink-400">기록된 감사 이벤트가 없습니다</p>
        </div>
      ) : (
        <div className="panel p-5">
          {events.map((event, idx) => {
            const prev = idx > 0 ? events[idx - 1] : null;
            const isGenesis = event.previousHash === GENESIS_HASH;
            const linked = isGenesis ? null : prev ? prev.entryHash === event.previousHash : null;

            return (
              <div key={event.id}>
                {idx > 0 && (
                  <div className="flex items-center gap-2 pl-[15px] py-1">
                    <div className={`w-px h-5 ${linked === false ? 'bg-red-300' : 'bg-emerald-300'}`} />
                    <span
                      className={`flex items-center gap-1 text-[10.5px] font-medium ${
                        linked === false ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {linked === false ? <Unlink size={11} /> : <Link2 size={11} />}
                      {linked === false ? '체인 끊김 — 해시 불일치' : '해시 일치'}
                    </span>
                  </div>
                )}

                <div
                  className={`flex gap-3.5 rounded border p-3.5 ${
                    linked === false ? 'border-red-200 bg-red-50/40' : 'border-line bg-white'
                  }`}
                >
                  <div
                    className={`shrink-0 w-7 h-7 rounded flex items-center justify-center ${
                      isGenesis ? 'bg-navy-50 text-navy-600' : 'bg-canvas text-ink-400'
                    }`}
                  >
                    {isGenesis ? <Flag size={13} /> : <Link2 size={13} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-ink-400 mono">#{event.id}</span>
                        <span className="px-1.5 h-[19px] inline-flex items-center bg-navy-50 text-navy-700 text-[10.5px] font-semibold rounded border border-navy-100">
                          {event.eventType}
                        </span>
                        {isGenesis && (
                          <span className="px-1.5 h-[19px] inline-flex items-center bg-ink-200/60 text-ink-600 text-[10.5px] font-semibold rounded border border-ink-200">
                            제네시스 · 체인 시작점
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-ink-400 tnum">
                        {format(new Date(event.createdAt), 'yyyy.MM.dd HH:mm:ss')}
                      </span>
                    </div>

                    <p className="text-[12.5px] text-ink-700 mt-1.5">
                      {event.aggregateType} · <span className="mono text-ink-600">{event.aggregateId}</span>
                    </p>

                    <div className="mt-2.5 flex items-center gap-1.5 text-[10.5px] mono flex-wrap">
                      <span className="px-1.5 py-0.5 bg-canvas border border-line-soft rounded text-ink-400">
                        prev {isGenesis ? '0x00…00' : truncateHash(event.previousHash)}
                      </span>
                      <span className="text-ink-300">→</span>
                      <span className="px-1.5 py-0.5 bg-canvas border border-line-soft rounded text-ink-600">
                        hash {truncateHash(event.entryHash)}
                      </span>
                    </div>
                  </div>
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
