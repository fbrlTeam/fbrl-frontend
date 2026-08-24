import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { LogOut, FlaskConical, Wallet, ArrowLeftRight, ShieldCheck, Activity, FileText, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoResetStatus } from '../../hooks/queries';

const TABS = [
  { to: '/demo', icon: LayoutDashboard, label: '개요', end: true },
  { to: '/demo/accounts', icon: Wallet, label: '계좌' },
  { to: '/demo/transfer', icon: ArrowLeftRight, label: '송금' },
  { to: '/demo/approvals', icon: ShieldCheck, label: '승인' },
  { to: '/demo/batch', icon: Activity, label: '배치·정산' },
  { to: '/demo/audit', icon: FileText, label: '감사로그' },
];

function useCountdown(nextResetAt: string | null | undefined) {
  const [label, setLabel] = useState('—');

  useEffect(() => {
    if (!nextResetAt) {
      setLabel('—');
      return;
    }
    const target = new Date(nextResetAt).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      const m = Math.floor(diff / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setLabel(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextResetAt]);

  return label;
}

export default function DemoLayout() {
  const { logout, username } = useAuth();
  const navigate = useNavigate();
  const { data: resetStatus } = useDemoResetStatus();
  const countdown = useCountdown(resetStatus?.nextResetAt);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="h-[52px] bg-navy-900 flex items-center justify-between pl-5 pr-4">
        <div className="flex items-center gap-3">
          <div className="w-[26px] h-[26px] rounded bg-white/10 border border-white/20 flex items-center justify-center">
            <FlaskConical size={13} className="text-white" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-[15px] font-semibold text-white tracking-tight">FBRL 데모 랩</span>
            <span className="w-px h-3 bg-white/20" />
            <span className="text-[12px] text-white/55 tracking-tight">
              신뢰성 메커니즘을 직접 실행해보는 체험 공간
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 h-[22px] px-2 rounded border border-white/20 text-[10px] font-semibold text-white/70 tracking-wide tnum">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            초기화까지 {countdown}
          </span>

          <span className="w-px h-4 bg-white/15" />

          <div className="flex items-center gap-2 pl-0.5">
            <div className="w-[26px] h-[26px] rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-[11px] font-semibold text-white">
                {(username || 'D').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden sm:flex flex-col leading-none gap-0.5">
              <span className="text-[12px] font-medium text-white">{username || 'demo'}</span>
              <span className="text-[10px] text-white/45">DEMO</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 h-[30px] px-2.5 rounded text-[12px] text-white/60 hover:text-white hover:bg-white/10 transition-colors duration-150"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">로그아웃</span>
          </button>
        </div>
      </header>

      <nav className="h-11 bg-white border-b border-line flex items-center px-5 gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex items-center gap-1.5 h-8 px-3 rounded-md text-[12.5px] font-medium whitespace-nowrap transition-colors duration-150 ${
                isActive ? 'bg-navy-50 text-navy-900 font-semibold' : 'text-ink-600 hover:bg-canvas hover:text-ink-900'
              }`
            }
          >
            <tab.icon size={14} />
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <main className="px-7 py-6 max-w-[1240px] mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
