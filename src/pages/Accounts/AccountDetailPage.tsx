import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { useAccount, useLedgerEntries, useAccountEodSnapshots } from '../../hooks/queries';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

type Tab = 'ledger' | 'eod';

export default function AccountDetailPage() {
  const { accountNumber } = useParams<{ accountNumber: string }>();
  const [tab, setTab] = useState<Tab>('ledger');
  const [ledgerPage, setLedgerPage] = useState(0);
  const [eodPage, setEodPage] = useState(0);

  const now = new Date();
  const [ledgerFrom] = useState(subDays(now, 30).toISOString());
  const [ledgerTo] = useState(now.toISOString());
  const [eodFrom] = useState(format(subDays(now, 30), 'yyyy-MM-dd'));
  const [eodTo] = useState(format(now, 'yyyy-MM-dd'));

  const { data: account } = useAccount(accountNumber || '');
  const { data: ledgerData, isLoading: ledgerLoading } = useLedgerEntries(
    accountNumber || '', ledgerFrom, ledgerTo, ledgerPage
  );
  const { data: eodData, isLoading: eodLoading } = useAccountEodSnapshots(
    accountNumber || '', eodFrom, eodTo, eodPage
  );

  if (!accountNumber) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-400 mb-1">계좌 상세</p>
        <h2 className="text-xl font-bold text-gray-900 tracking-wide">{accountNumber}</h2>
      </div>

      {account && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <p className="text-xs text-gray-400 mb-1">잔액</p>
          <p className="text-3xl font-bold text-gray-900">
            {Number(account.balance).toLocaleString()}<span className="text-base font-normal text-gray-400 ml-1">원</span>
          </p>
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => { setTab('ledger'); setLedgerPage(0); }}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            tab === 'ledger' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          원장
        </button>
        <button
          onClick={() => { setTab('eod'); setEodPage(0); }}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            tab === 'eod' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          EOD 스냅샷
        </button>
      </div>

      {tab === 'ledger' && (
        <DataTable
          columns={[
            {
              key: 'direction',
              header: '유형',
              render: (item) => (
                <span className={`text-xs font-medium ${item.direction === 'DEBIT' ? 'text-red-500' : 'text-blue-500'}`}>
                  {item.direction === 'DEBIT' ? '출금' : '입금'}
                </span>
              ),
            },
            {
              key: 'amount',
              header: '금액',
              render: (item) => (
                <span className={item.direction === 'DEBIT' ? 'text-red-500' : 'text-blue-500'}>
                  {item.direction === 'DEBIT' ? '-' : '+'}{Number(item.amount).toLocaleString()}
                </span>
              ),
            },
            {
              key: 'transactionId',
              header: '거래 ID',
              render: (item) => (
                <span className="text-xs text-gray-400 font-mono">{item.transactionId.substring(0, 8)}...</span>
              ),
            },
            {
              key: 'occurredAt',
              header: '일시',
              render: (item) => format(new Date(item.occurredAt), 'yyyy.MM.dd HH:mm:ss'),
            },
          ]}
          data={ledgerData?.content || []}
          page={ledgerPage}
          totalPages={ledgerData?.totalPages || 0}
          totalElements={ledgerData?.totalElements || 0}
          onPageChange={setLedgerPage}
          loading={ledgerLoading}
          emptyMessage="원장 기록이 없습니다"
        />
      )}

      {tab === 'eod' && (
        <DataTable
          columns={[
            {
              key: 'settlementDate',
              header: '정산일',
              render: (item) => item.settlementDate,
            },
            {
              key: 'closingBalance',
              header: '마감잔액',
              render: (item) => `${Number(item.closingBalance).toLocaleString()}원`,
            },
            {
              key: 'interestAmount',
              header: '이자',
              render: (item) => (
                <StatusBadge status={Number(item.interestAmount) > 0 ? 'APPROVED' : 'PENDING'} type="approval" />
              ),
            },
            {
              key: 'interestValue',
              header: '이자금액',
              render: (item) => `${Number(item.interestAmount).toLocaleString()}원`,
            },
            {
              key: 'computedAt',
              header: '계산일시',
              render: (item) => format(new Date(item.computedAt), 'MM.dd HH:mm'),
            },
          ]}
          data={eodData?.content || []}
          page={eodPage}
          totalPages={eodData?.totalPages || 0}
          totalElements={eodData?.totalElements || 0}
          onPageChange={setEodPage}
          loading={eodLoading}
          emptyMessage="EOD 스냅샷이 없습니다"
        />
      )}
    </div>
  );
}
