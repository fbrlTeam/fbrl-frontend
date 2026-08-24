import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Fingerprint,
  Link2,
  BookOpen,
  ShieldCheck,
  Calendar,
  Scale,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { useDemoResetStatus } from '../../hooks/queries';

const MECHANISMS = [
  {
    icon: Fingerprint,
    title: 'API 멱등성',
    ref: '@CheckIdempotency · Redis SETNX',
    body: '같은 요청이 두 번 들어와도 자금이 두 번 움직이지 않도록 요청마다 고유 키를 발급합니다. 송금 화면에서 실제 발급되는 키를 확인할 수 있습니다.',
    href: '/demo/transfer',
    cta: '송금해보기',
  },
  {
    icon: BookOpen,
    title: '복식부기 원장',
    ref: 'LedgerEntry · append-only',
    body: '잔액을 필드로 저장하지 않고 원장 합산으로 파생시킵니다. 계좌 탭에서 원장 내역을 직접 조회할 수 있습니다.',
    href: '/demo/accounts',
    cta: '계좌 만들어보기',
  },
  {
    icon: ShieldCheck,
    title: 'Maker-Checker 이중 승인',
    ref: '4-eyes principle',
    body: '기준 금액을 넘는 이체는 기안자와 승인자가 반드시 달라야 집행됩니다. 본인 계정으로 승인을 시도하면 차단되는 것도 확인할 수 있습니다.',
    href: '/demo/approvals',
    cta: '승인 흐름 체험하기',
  },
  {
    icon: Link2,
    title: '해시체인 감사로그',
    ref: 'OutboxEvent · SHA-256',
    body: '각 이벤트가 직전 이벤트의 해시를 품습니다. 데모 데이터는 리셋마다 한 건을 일부러 변조해 무결성 검증이 실패하는 모습을 보여줍니다.',
    href: '/demo/audit',
    cta: '체인 검증해보기',
  },
  {
    icon: Calendar,
    title: 'EOD 정산 배치',
    ref: 'Spring Batch',
    body: '버튼을 눌러 직접 정산 Job을 실행하고, 계좌별 마감 스냅샷과 이자 계산 결과를 확인할 수 있습니다.',
    href: '/demo/batch',
    cta: '배치 실행해보기',
  },
  {
    icon: Scale,
    title: '대사(Reconciliation)',
    ref: 'EodSnapshot ↔ LedgerEntry',
    body: '마감 스냅샷과 원장 전량 재계산 결과를 대조합니다. 대차가 어긋나면 그 차액까지 직접 볼 수 있습니다.',
    href: '/demo/batch',
    cta: '대사 실행해보기',
  },
];

export default function DemoHomePage() {
  const navigate = useNavigate();
  const { data: resetStatus } = useDemoResetStatus();

  return (
    <div className="space-y-6">
      <div className="panel px-6 py-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded bg-navy-50 flex items-center justify-center shrink-0">
          <Info size={18} className="text-navy-600" />
        </div>
        <div>
          <h1 className="text-[16px] font-bold text-ink-900">이 랩은 무엇인가요</h1>
          <p className="text-[12.5px] text-ink-500 leading-relaxed mt-1.5">
            FBRL 백엔드가 구현한 금융 신뢰성 패턴 — 분산 동시성 제어, 이중 승인, 해시체인 감사로그,
            정산·대사 배치 — 을 운영 데이터와 완전히 분리된 별도 네임스페이스에서 직접 실행해볼 수
            있는 공간입니다. 여기서 만든 계좌·거래·승인 요청은 실제 서비스에 어떤 영향도 주지 않으며,
            {resetStatus?.lastResetAt && (
              <>
                {' '}
                마지막 초기화는 {format(new Date(resetStatus.lastResetAt), 'HH:mm:ss')}에 있었고
              </>
            )}{' '}
            데이터는 주기적으로 전체 초기화됩니다.
          </p>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-ink-400 tracking-wider uppercase mb-3">
          체험 가능한 신뢰성 메커니즘
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {MECHANISMS.map((m) => (
            <div key={m.title} className="panel p-5 flex flex-col">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded bg-navy-50 text-navy-600 flex items-center justify-center shrink-0">
                  <m.icon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-ink-900">{m.title}</p>
                  <p className="text-[11px] text-ink-400 mono mt-0.5 truncate">{m.ref}</p>
                </div>
              </div>
              <p className="text-[12px] text-ink-500 leading-relaxed mt-3 flex-1">{m.body}</p>
              <button
                onClick={() => navigate(m.href)}
                className="flex items-center gap-1 text-[11.5px] font-semibold text-navy-600 hover:text-navy-800 transition-colors duration-150 mt-4 self-start"
              >
                {m.cta}
                <ArrowUpRight size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
