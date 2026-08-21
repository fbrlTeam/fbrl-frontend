import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAccount, useCreateAccount } from '../../hooks/queries';
import PageHeader from '../../components/common/PageHeader';

export default function AccountsPage() {
  const [searchNumber, setSearchNumber] = useState('');
  const [query, setQuery] = useState('');
  const [createError, setCreateError] = useState('');
  const navigate = useNavigate();
  const { data: account, isLoading, isError } = useAccount(query);
  const createMutation = useCreateAccount();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchNumber.trim());
  };

  const handleCreate = async () => {
    setCreateError('');
    try {
      const newAccount = await createMutation.mutateAsync();
      setSearchNumber(newAccount.accountNumber);
      setQuery(newAccount.accountNumber);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setCreateError(axiosErr.response?.data?.message || '계좌 개설에 실패했습니다.');
    }
  };

  return (
    <div>
      <PageHeader
        title="계좌 관리"
        description="계좌번호로 잔액과 원장 내역을 조회하거나 신규 계좌를 개설합니다"
        actions={
          <button onClick={handleCreate} disabled={createMutation.isPending} className="btn-primary">
            <Plus size={15} />
            계좌 개설
          </button>
        }
      />

      <div className="panel p-5 mb-4">
        <label className="field-label block mb-2">계좌번호 조회</label>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              placeholder="000-0000-0000"
              className="field pl-9 mono"
            />
          </div>
          <button type="submit" className="btn-secondary px-5">
            조회
          </button>
        </form>
      </div>

      {createMutation.isSuccess && createMutation.data && (
        <div className="panel px-5 py-3.5 mb-4 border-l-[3px] border-l-emerald-500 flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <p className="text-[12.5px] text-ink-700">
            신규 계좌가 개설되었습니다 —{' '}
            <span className="font-semibold mono">{createMutation.data.accountNumber}</span>
          </p>
        </div>
      )}

      {createError && (
        <div className="panel px-5 py-3.5 mb-4 border-l-[3px] border-l-red-500 flex items-center gap-2.5">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-[12.5px] text-red-700">{createError}</p>
        </div>
      )}

      {isLoading && query && (
        <div className="panel p-14 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-navy-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && query && (
        <div className="panel p-14 text-center">
          <p className="text-[13px] text-ink-400">
            <span className="mono">{query}</span> 계좌를 찾을 수 없습니다
          </p>
        </div>
      )}

      {account && (
        <button
          onClick={() => navigate(`/accounts/${account.accountNumber}`)}
          className="panel w-full px-6 py-5 text-left hover:border-navy-200 transition-colors duration-150 group"
        >
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="field-label mb-1.5">계좌번호</p>
              <p className="text-[16px] font-semibold text-ink-900 mono tracking-tight">
                {account.accountNumber}
              </p>
              <p className="text-[11px] text-ink-400 mt-1.5 tnum">
                내부 ID {account.id} · 버전 {account.version ?? 0}
              </p>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="field-label mb-1.5">현재 잔액</p>
                <p className="text-[24px] font-bold text-ink-900 tnum leading-none">
                  {Number(account.balance).toLocaleString()}
                  <span className="text-[13px] font-medium text-ink-400 ml-1">원</span>
                </p>
                <p className="text-[10.5px] text-ink-400 mt-1.5">원장 합산 파생값</p>
              </div>
              <ChevronRight
                size={18}
                className="text-ink-300 group-hover:text-navy-500 transition-colors"
              />
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
