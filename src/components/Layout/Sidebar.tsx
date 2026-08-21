import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Wallet,
  ArrowLeftRight,
  ShieldCheck,
  Calendar,
  Scale,
  Activity,
  FileText,
} from 'lucide-react';

const navGroups = [
  {
    label: '개요',
    items: [
      { to: '/', icon: LayoutDashboard, label: '대시보드', end: true },
      { to: '/reliability', icon: Layers, label: '신뢰성 메커니즘' },
    ],
  },
  {
    label: '거래 관리',
    items: [
      { to: '/accounts', icon: Wallet, label: '계좌 관리' },
      { to: '/transfer', icon: ArrowLeftRight, label: '이체' },
      { to: '/approvals', icon: ShieldCheck, label: '승인 관리' },
    ],
  },
  {
    label: '정산 · 대사',
    items: [
      { to: '/eod-settlement', icon: Calendar, label: 'EOD 정산' },
      { to: '/reconciliation', icon: Scale, label: '대사' },
      { to: '/batch-jobs', icon: Activity, label: '배치 모니터링' },
    ],
  },
  {
    label: '감사',
    items: [{ to: '/audit-log', icon: FileText, label: '감사 로그' }],
  },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-[52px] bottom-0 w-[232px] bg-white border-r border-line flex flex-col z-40">
      <nav className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p className="px-5 mb-1.5 text-[10px] font-semibold text-ink-400 tracking-wider uppercase">
              {group.label}
            </p>
            <div className="px-2.5 space-y-px">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `relative flex items-center gap-2.5 h-9 pl-3 pr-2.5 rounded-md text-[13px] transition-colors duration-150 ${
                      isActive
                        ? 'bg-navy-50 text-navy-900 font-semibold'
                        : 'text-ink-600 font-medium hover:bg-canvas hover:text-ink-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-navy-900" />
                      )}
                      <item.icon
                        size={16}
                        strokeWidth={isActive ? 2.1 : 1.7}
                        className={isActive ? 'text-navy-700' : 'text-ink-400'}
                      />
                      <span className="tracking-tight">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-5 py-3 border-t border-line-soft">
        <p className="text-[10px] text-ink-400 leading-relaxed">
          Financial Backend
          <br />
          Reliability Lab · v1.0.0
        </p>
      </div>
    </aside>
  );
}
