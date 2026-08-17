import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-end px-6 sticky top-0 z-40">
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors duration-200"
      >
        <LogOut size={16} />
        <span>로그아웃</span>
      </button>
    </header>
  );
}
