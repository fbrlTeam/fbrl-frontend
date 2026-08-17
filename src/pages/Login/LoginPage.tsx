import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLogin } from '../../hooks/queries';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await loginMutation.mutateAsync({ username, password });
      login(result.token);
      navigate('/');
    } catch {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-[#0a0a0a] items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/15 blur-[100px] animate-pulse [animation-delay:1s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-purple-500/10 blur-[80px] animate-pulse [animation-delay:2s]" />
        </div>

        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />

        <div className="relative z-10 px-16 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="text-white/90 text-lg font-semibold tracking-tight">FBRL</span>
          </div>

          <h2 className="text-[40px] leading-tight font-bold text-white tracking-tight mb-4">
            금융 백엔드<br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              신뢰성 실험실
            </span>
          </h2>

          <p className="text-white/40 text-[15px] leading-relaxed">
            분산 트랜잭션, Saga 오케스트레이션, CDC 기반 이벤트 발행,
            해시체인 감사로그까지 — 금융 시스템의 신뢰성 패턴을
            직접 검증하는 플랫폼입니다.
          </p>

          <div className="mt-12 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
              <span className="text-white/30 text-xs">시스템 정상</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <span className="text-white/20 text-xs">v1.0.0</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div className="flex-1 flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-[360px]">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="text-gray-900 text-lg font-semibold tracking-tight">FBRL</span>
          </div>

          <div className="mb-8">
            <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">
              로그인
            </h1>
            <p className="text-[14px] text-gray-400 mt-2 leading-relaxed">
              관리자 계정으로 로그인하세요
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-gray-600 pl-0.5">아이디</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디를 입력하세요"
                required
                autoFocus
                className="w-full h-[52px] px-4 bg-gray-50 rounded-[14px] text-[15px] text-gray-900 placeholder:text-gray-300 outline-none border-[1.5px] border-transparent focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)] transition-all duration-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-gray-600 pl-0.5">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
                className="w-full h-[52px] px-4 bg-gray-50 rounded-[14px] text-[15px] text-gray-900 placeholder:text-gray-300 outline-none border-[1.5px] border-transparent focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)] transition-all duration-200"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 rounded-xl">
                <div className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                <p className="text-[13px] text-red-500">{error}</p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-[52px] bg-gray-900 hover:bg-gray-800 active:scale-[0.98] text-white text-[15px] font-semibold rounded-[14px] transition-all duration-200 disabled:opacity-40 disabled:active:scale-100 shadow-sm hover:shadow-md"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-white/70">로그인 중...</span>
                  </div>
                ) : (
                  '로그인'
                )}
              </button>
            </div>
          </form>

          <div className="mt-10 pt-6 border-t border-gray-100">
            <p className="text-[12px] text-gray-300 text-center">
              Financial Backend Reliability Lab © 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
