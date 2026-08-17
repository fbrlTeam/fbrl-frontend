import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { useAccount, useCreateAccount } from '../../hooks/queries';

export default function AccountsPage() {
  const [searchNumber, setSearchNumber] = useState('');
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { data: account, isLoading, isError } = useAccount(query);
  const createMutation = useCreateAccount();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchNumber.trim());
  };

  const handleCreate = async () => {
    try {
      const newAccount = await createMutation.mutateAsync();
      setSearchNumber(newAccount.accountNumber);
      setQuery(newAccount.accountNumber);
    } catch {
      alert('계좌 개설에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">계좌 관리</h2>
          <p className="text-sm text-gray-400 mt-1">계좌를 조회하거나 새로 개설하세요</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={createMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 active:scale-[0.97] text-white text-sm font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
        >
          <Plus size={16} />
          계좌 개설
        </button>
      </div>

      <form onSubmit={handleSearch} className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
          type="text"
          value={searchNumber}
          onChange={(e) => setSearchNumber(e.target.value)}
          placeholder="계좌번호를 입력하세요"
          className="w-full pl-11 pr-4 py-3.5 bg-white rounded-2xl border border-gray-100 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
        />
      </form>

      {isLoading && query && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && query && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-sm text-gray-400">계좌를 찾을 수 없습니다</p>
        </div>
      )}

      {account && (
        <button
          onClick={() => navigate(`/accounts/${account.accountNumber}`)}
          className="w-full bg-white rounded-2xl border border-gray-100 p-6 text-left hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">계좌번호</p>
              <p className="text-base font-semibold text-gray-900 tracking-wide">{account.accountNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">잔액</p>
              <p className="text-xl font-bold text-gray-900">
                {Number(account.balance).toLocaleString()}<span className="text-sm font-normal text-gray-400 ml-0.5">원</span>
              </p>
            </div>
          </div>
        </button>
      )}

      {createMutation.isSuccess && createMutation.data && (
        <div className="bg-emerald-50 rounded-2xl p-4">
          <p className="text-sm text-emerald-700">
            계좌가 개설되었습니다: <span className="font-semibold">{createMutation.data.accountNumber}</span>
          </p>
        </div>
      )}
    </div>
  );
}
