import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useTransfer } from '../../hooks/queries';

export default function TransferPage() {
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const transferMutation = useTransfer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      await transferMutation.mutateAsync({
        senderAccountNumber: sender,
        receiverAccountNumber: receiver,
        amount: Number(amount),
      });
      setSuccess(true);
      setSender('');
      setReceiver('');
      setAmount('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { code?: string; message?: string } } };
      if (axiosErr.response?.data?.code === 'APPROVAL_REQUIRED') {
        setError('이체 금액이 승인 기준을 초과합니다. 승인 관리에서 기안해주세요.');
      } else {
        setError(axiosErr.response?.data?.message || '이체에 실패했습니다.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">이체</h2>
        <p className="text-sm text-gray-400 mt-1">계좌 간 자금을 이동합니다</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">출금 계좌</label>
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="출금 계좌번호"
              required
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white border border-transparent focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div className="flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <ArrowRight size={14} className="text-gray-400 rotate-90" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">입금 계좌</label>
            <input
              type="text"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              placeholder="입금 계좌번호"
              required
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white border border-transparent focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">금액</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
              min="1"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white border border-transparent focus:border-blue-500 transition-all duration-200"
            />
            {amount && Number(amount) > 0 && (
              <p className="text-xs text-gray-400 mt-1.5 px-1">
                {Number(amount).toLocaleString()}원
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-xs text-emerald-600">이체가 완료되었습니다.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={transferMutation.isPending}
            className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            {transferMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              '이체하기'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
