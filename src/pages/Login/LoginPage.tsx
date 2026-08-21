import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLogin } from '../../hooks/queries';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await loginMutation.mutateAsync({ username, password });
      if (result.role !== 'ADMIN') {
        setError('관리자 권한이 없는 계정입니다. 운영 콘솔은 ADMIN 계정만 접근할 수 있습니다.');
        return;
      }
      login(result.token, result.role);
      navigate('/');
    } catch {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* 기관 상단바 */}
      <header className="h-[52px] bg-navy-900 flex items-center px-5 shrink-0">
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
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[880px] grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] bg-white border border-line rounded-lg overflow-hidden">
          {/* 좌: 시스템 설명 */}
          <div className="hidden lg:flex flex-col justify-between p-9 bg-navy-950 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '28px 28px',
              }}
            />
            <div className="relative">
              <p className="text-[11px] font-semibold text-navy-300 tracking-wider uppercase">
                Financial Backend Reliability Lab
              </p>
              <h2 className="text-[26px] leading-snug font-bold text-white tracking-tight mt-3">
                금융 거래의 신뢰성을
                <br />
                검증하는 운영 콘솔
              </h2>
              <p className="text-[13px] text-white/45 leading-relaxed mt-4">
                분산 동시성 제어, 복식부기 원장, 해시체인 감사로그, EOD 정산·대사까지 —
                금융 백엔드에 요구되는 신뢰성 패턴을 실제 데이터로 확인합니다.
              </p>
            </div>

            <div className="relative mt-10 pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
              {[
                { k: '분산 동시성', v: 'Redisson' },
                { k: '감사 무결성', v: 'SHA-256 체인' },
                { k: '정산 배치', v: 'Spring Batch' },
              ].map((it) => (
                <div key={it.k}>
                  <p className="text-[10px] text-white/35">{it.k}</p>
                  <p className="text-[12px] text-white/80 font-medium mt-0.5">{it.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 우: 인증 */}
          <div className="p-9 flex flex-col justify-center">
            <div className="mb-7">
              <h1 className="text-[20px] font-bold text-ink-900 tracking-tight">관리자 로그인</h1>
              <p className="text-[12.5px] text-ink-500 mt-1.5">
                발급받은 운영 계정으로 접속하세요
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="field-label block">아이디</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  required
                  autoFocus
                  autoComplete="username"
                  className="field"
                />
              </div>

              <div className="space-y-1.5">
                <label className="field-label block">비밀번호</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    required
                    autoComplete="current-password"
                    className="field pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-md">
                  <AlertCircle size={14} className="text-red-500 shrink-0 mt-px" />
                  <p className="text-[12px] text-red-700 leading-relaxed">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="btn-primary w-full h-[42px] mt-1"
              >
                {loginMutation.isPending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    인증 중
                  </>
                ) : (
                  '로그인'
                )}
              </button>
            </form>

            <div className="mt-7 pt-4 border-t border-line-soft flex items-center gap-1.5">
              <Lock size={11} className="text-ink-400" />
              <p className="text-[11px] text-ink-400">
                모든 접근은 감사 로그에 기록됩니다
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-4 text-center shrink-0">
        <p className="text-[11px] text-ink-400">
          Financial Backend Reliability Lab © 2026
        </p>
      </footer>
    </div>
  );
}
