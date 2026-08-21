import { LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { logout, username, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 inset-x-0 h-[52px] bg-navy-900 flex items-center justify-between pl-5 pr-4 z-50">
      {/* 기관 식별 */}
      <div className="flex items-center gap-3">
        <div className="w-[26px] h-[26px] rounded bg-white/10 border border-white/20 flex items-center justify-center">
          <span className="text-[11px] font-bold text-white tracking-tight">F</span>
        </div>
        <div className="flex items-baseline gap-2.5">
          <span className="text-[15px] font-semibold text-white tracking-tight">FBRL</span>
          <span className="w-px h-3 bg-white/20" />
          <span className="text-[12px] text-white/55 tracking-tight">
            Transaction Reliability Console
          </span>
        </div>
      </div>

      {/* 운영 컨텍스트 */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:flex items-center gap-1.5 h-[22px] px-2 rounded border border-white/20 text-[10px] font-semibold text-white/70 tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          LOCAL
        </span>

        <span className="w-px h-4 bg-white/15" />

        <div className="flex items-center gap-2 pl-0.5">
          <div className="w-[26px] h-[26px] rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-[11px] font-semibold text-white">
              {(username || 'A').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:flex flex-col leading-none gap-0.5">
            <span className="text-[12px] font-medium text-white">{username || 'admin'}</span>
            <span className="text-[10px] text-white/45">{role || 'ADMIN'}</span>
          </div>
          <ChevronDown size={13} className="text-white/30 hidden sm:block" />
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
  );
}
