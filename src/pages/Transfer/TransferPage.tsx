import { useState } from 'react';
import { ArrowDown, CheckCircle2, AlertCircle, ShieldCheck, Fingerprint, Lock } from 'lucide-react';
import { useTransfer } from '../../hooks/queries';
import PageHeader from '../../components/common/PageHeader';

export default function TransferPage() {
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [amount, setAmount] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [needsApproval, setNeedsApproval] = useState(false);
  const transferMutation = useTransfer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setNeedsApproval(false);

    try {
      await transferMutation.mutateAsync({
        senderAccountNumber: sender,
        receiverAccountNumber: receiver,
        amount: Number(amount),
      });
      setSuccess(`${Number(amount).toLocaleString()}원이 이체되었습니다.`);
      setSender('');
      setReceiver('');
      setAmount('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { code?: string; message?: string } } };
      const code = axiosErr.response?.data?.code;
      if (code === 'APPROVAL_REQUIRED') {
        setNeedsApproval(true);
        setError('이체 금액이 결재 기준을 초과합니다. 승인 관리에서 기안 절차를 거쳐야 합니다.');
      } else {
        setError(axiosErr.response?.data?.message || '이체 처리에 실패했습니다.');
      }
    }
  };

  return (
    <div>
      <PageHeader title="이체" description="계좌 간 자금을 이동합니다" />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] gap-4 items-start">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">이체 정보 입력</span>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="field-label block">출금 계좌</label>
              <input
                type="text"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="000-0000-0000"
                required
                className="field mono"
              />
            </div>

            <div className="flex justify-center">
              <div className="w-7 h-7 rounded-full bg-canvas border border-line flex items-center justify-center">
                <ArrowDown size={13} className="text-ink-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="field-label block">입금 계좌</label>
              <input
                type="text"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                placeholder="000-0000-0000"
                required
                className="field mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="field-label block">이체 금액</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                required
                min="1"
                className="field tnum text-right"
              />
              {amount && Number(amount) > 0 && (
                <p className="text-[12px] text-ink-600 pt-0.5 text-right tnum font-medium">
                  {Number(amount).toLocaleString()}원
                </p>
              )}
            </div>

            {error && (
              <div
                className={`flex items-start gap-2 px-3 py-2.5 rounded border ${
                  needsApproval
                    ? 'bg-amber-50 border-amber-100'
                    : 'bg-red-50 border-red-100'
                }`}
              >
                {needsApproval ? (
                  <ShieldCheck size={14} className="text-amber-500 shrink-0 mt-px" />
                ) : (
                  <AlertCircle size={14} className="text-red-500 shrink-0 mt-px" />
                )}
                <p className={`text-[12px] leading-relaxed ${needsApproval ? 'text-amber-800' : 'text-red-700'}`}>
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-px" />
                <p className="text-[12px] text-emerald-800">{success}</p>
              </div>
            )}

            <button type="submit" disabled={transferMutation.isPending} className="btn-primary w-full">
              {transferMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  처리 중
                </>
              ) : (
                '이체 실행'
              )}
            </button>
          </form>
        </div>

        {/* 적용되는 통제 안내 */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">이 요청에 적용되는 통제</span>
          </div>
          <dl className="divide-y divide-line-soft">
            <Control
              icon={<Fingerprint size={15} />}
              title="멱등성 보장"
              body="요청마다 고유 키가 발급되어, 같은 요청이 중복 전송돼도 자금은 한 번만 이동합니다."
            />
            <Control
              icon={<Lock size={15} />}
              title="분산 락"
              body="동일 계좌에 대한 동시 이체는 직렬화되어 처리됩니다. 잔액 경합으로 인한 이중 출금이 발생하지 않습니다."
            />
            <Control
              icon={<ShieldCheck size={15} />}
              title="이상거래 탐지 · 결재 통제"
              body="기준 금액을 초과하는 단건 이체는 즉시 차단되며, 결재 기준 초과 건은 기안·승인 절차를 거쳐야 집행됩니다."
            />
          </dl>
        </div>
      </div>
    </div>
  );
}

function Control({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3 px-5 py-4">
      <div className="w-8 h-8 rounded bg-navy-50 text-navy-600 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <dt className="text-[12.5px] font-semibold text-ink-900">{title}</dt>
        <dd className="text-[11.5px] text-ink-500 leading-relaxed mt-1">{body}</dd>
      </div>
    </div>
  );
}
