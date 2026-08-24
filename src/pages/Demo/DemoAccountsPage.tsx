import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { Plus, Copy, Check, AlertCircle, Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useCreateDemoAccount, useDemoAccount, useDemoLedgerEntries } from '../../hooks/queries';
import { useDemoSession } from '../../contexts/DemoSessionContext';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';

export default function DemoAccountsPage() {
  const createMutation = useCreateDemoAccount();
  const { accounts, addAccount } = useDemoSession();
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const handleCreate = async () => {
    setError('');
    try {
      const account = await createMutation.mutateAsync();
      addAccount(account.accountNumber);
    } catch {
      setError('계좌 개설에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleCopy = (accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(accountNumber);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div>
      <PageHeader
        title="계좌"
        description="데모 네임스페이스에 계좌를 개설하고 잔액·원장을 조회합니다"
        actions={
          <button onClick={handleCreate} disabled={createMutation.isPending} className="btn-primary">
            <Plus size={15} />
            계좌 개설
          </button>
        }
      />

      {error && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded mb-4">
          <AlertCircle size={14} className="text-red-500 shrink-0 mt-px" />
          <p className="text-[12px] text-red-700">{error}</p>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="panel p-14 text-center">
          <Wallet size={22} className="text-ink-200 mx-auto mb-2.5" />
          <p className="text-[13px] text-ink-400 mb-4">아직 개설한 계좌가 없습니다</p>
          <button onClick={handleCreate} disabled={createMutation.isPending} className="btn-primary">
            <Plus size={15} />첫 계좌 개설
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((acc) => (
            <AccountRow
              key={acc.accountNumber}
              accountNumber={acc.accountNumber}
              onOpen={() => setSelected(acc.accountNumber)}
              onCopy={() => handleCopy(acc.accountNumber)}
              copied={copied === acc.accountNumber}
            />
          ))}
        </div>
      )}

      <LedgerModal accountNumber={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function AccountRow({
  accountNumber,
  onOpen,
  onCopy,
  copied,
}: {
  accountNumber: string;
  onOpen: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const { data, isLoading } = useDemoAccount(accountNumber);

  return (
    <button
      onClick={onOpen}
      className="panel w-full px-5 py-4 text-left hover:border-navy-200 transition-colors duration-150 flex items-center justify-between gap-5 flex-wrap"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded bg-navy-50 flex items-center justify-center shrink-0">
          <Wallet size={15} className="text-navy-600" />
        </div>
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold text-ink-900 mono">{accountNumber}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            className="flex items-center gap-1 text-[11px] text-ink-400 hover:text-ink-600 mt-0.5"
          >
            {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
            {copied ? '복사됨' : '계좌번호 복사'}
          </button>
        </div>
      </div>

      <div className="text-right">
        <p className="field-label mb-1">잔액</p>
        {isLoading ? (
          <div className="w-16 h-4 rounded bg-canvas animate-pulse ml-auto" />
        ) : (
          <p className="text-[16px] font-bold text-ink-900 tnum leading-none">
            {Number(data?.balance ?? 0).toLocaleString()}
            <span className="text-[11px] font-medium text-ink-400 ml-1">원</span>
          </p>
        )}
      </div>
    </button>
  );
}

function LedgerModal({ accountNumber, onClose }: { accountNumber: string | null; onClose: () => void }) {
  const [{ from, to }] = useState(() => {
    const now = new Date();
    return { from: subDays(now, 30).toISOString(), to: now.toISOString() };
  });
  const { data, isLoading } = useDemoLedgerEntries(accountNumber || '', from, to, 0, 50);

  return (
    <Modal open={!!accountNumber} onClose={onClose} title="원장 내역" size="lg">
      <p className="text-[11px] text-ink-400 mono mb-4">{accountNumber}</p>
      {isLoading ? (
        <div className="py-10 flex justify-center">
          <div className="w-5 h-5 border-2 border-navy-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data || data.content.length === 0 ? (
        <p className="text-[12.5px] text-ink-400 text-center py-10">최근 30일간 원장 기록이 없습니다</p>
      ) : (
        <div className="space-y-1.5 max-h-[52vh] overflow-y-auto">
          {data.content.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded border border-line-soft"
            >
              <div
                className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                  entry.direction === 'CREDIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                }`}
              >
                {entry.direction === 'CREDIT' ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11.5px] text-ink-500 mono truncate">{entry.transactionId}</p>
                <p className="text-[10.5px] text-ink-400 tnum mt-0.5">
                  {format(new Date(entry.occurredAt), 'yyyy.MM.dd HH:mm:ss')}
                </p>
              </div>
              <span
                className={`text-[13px] font-semibold tnum shrink-0 ${
                  entry.direction === 'CREDIT' ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {entry.direction === 'CREDIT' ? '+' : '-'}
                {Number(entry.amount).toLocaleString()}원
              </span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
