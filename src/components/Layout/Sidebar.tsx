import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Activity,
  FileText,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '대시보드' },
  { to: '/accounts', icon: Wallet, label: '계좌 관리' },
  { to: '/transfer', icon: ArrowLeftRight, label: '이체' },
  { to: '/approvals', icon: ShieldCheck, label: '승인 관리' },
  { to: '/eod-settlement', icon: Calendar, label: 'EOD 정산' },
  { to: '/reconciliation', icon: AlertTriangle, label: '대사' },
  { to: '/batch-jobs', icon: Activity, label: '배치' },
  { to: '/audit-log', icon: FileText, label: '감사 로그' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-gray-100 flex flex-col z-50">
      <div className="px-6 py-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          FBRL
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Financial Backend Reliability Lab</p>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon
                size={18}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2 px-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-blue-600">A</span>
          </div>
          <span className="text-xs text-gray-500">Admin</span>
        </div>
      </div>
    </aside>
  );
}
