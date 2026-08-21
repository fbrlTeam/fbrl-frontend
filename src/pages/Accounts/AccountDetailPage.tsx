import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useAccount, useLedgerEntries, useAccountEodSnapshots } from '../../hooks/queries';
import DataTable from '../../components/common/DataTable';

type Tab = 'ledger' | 'eod';

export default function AccountDetailPage() {
  const { accountNumber } = useParams<{ accountNumber: string }>();
  const navigate = useNavigate();
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
    accountNumber || '',
    ledgerFrom,
    ledgerTo,
    ledgerPage
  );
  const { data: eodData, isLoading: eodLoading } = useAccountEodSnapshots(
    accountNumber || '',
    eodFrom,
    eodTo,
    eodPage
  );

  if (!accountNumber) return null;

  const entries = ledgerData?.content ?? [];
  const debitSum = entries
    .filter((e) => e.direction === 'DEBIT')
    .reduce((s, e) => s + Number(e.amount), 0);
  const creditSum = entries
    .filter((e) => e.direction === 'CREDIT')
    .reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div>
      <button
        onClick={() => navigate('/accounts')}
        className="flex items-center gap-1.5 text-[12px] text-ink-500 hover:text-ink-800 transition-colors duration-150 mb-4"
      >
        <ArrowLeft size={14} />
        계좌 관리
      </button>

      {/* 계좌 요약 */}
      <div className="panel px-6 py-5 mb-4">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="field-label mb-1.5">계좌번호</p>
            <p className="text-[20px] font-bold text-ink-900 mono tracking-tight">{accountNumber}</p>
          </div>

          <dl className="flex items-end gap-8">
            <div className="text-right">
              <dt className="field-label mb-1">조회 기간 차변 합</dt>
              <dd className="text-[13px] font-semibold text-red-600 tnum">
                {debitSum.toLocaleString()}원
              </dd>
            </div>
            <div className="text-right">
              <dt className="field-label mb-1">조회 기간 대변 합</dt>
              <dd className="text-[13px] font-semibold text-navy-600 tnum">
                {creditSum.toLocaleString()}원
              </dd>
            </div>
            <div className="text-right pl-8 border-l border-line">
              <dt className="field-label mb-1">현재 잔액</dt>
              <dd className="text-[26px] font-bold text-ink-900 tnum leading-none">
                {account ? Number(account.balance).toLocaleString() : '—'}
                <span className="text-[13px] font-medium text-ink-400 ml-1">원</span>
              </dd>
            </div>
          </dl>
        </div>
        <p className="text-[10.5px] text-ink-400 mt-4 pt-3.5 border-t border-line-soft">
          잔액은 저장된 값이 아니라 append-only 원장의 합산으로 파생됩니다 — 원장이 유일한 진실의 원천(SSOT)입니다.
        </p>
      </div>

      <div className="segmented mb-4">
        <button
          data-active={tab === 'ledger'}
          onClick={() => {
            setTab('ledger');
            setLedgerPage(0);
          }}
        >
          원장 내역
        </button>
        <button
          data-active={tab === 'eod'}
          onClick={() => {
            setTab('eod');
            setEodPage(0);
          }}
        >
          EOD 스냅샷
        </button>
      </div>

      {tab === 'ledger' && (
        <DataTable
          columns={[
            {
              key: 'direction',
              header: '구분',
              render: (item) => (
                <span
                  className={`inline-flex items-center gap-1 text-[11.5px] font-semibold ${
                    item.direction === 'DEBIT' ? 'text-red-600' : 'text-navy-600'
                  }`}
                >
                  {item.direction === 'DEBIT' ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownLeft size={12} />
                  )}
                  {item.direction === 'DEBIT' ? '출금 (차변)' : '입금 (대변)'}
                </span>
              ),
            },
            {
              key: 'amount',
              header: '금액',
              align: 'right',
              render: (item) => (
                <span
                  className={`font-semibold ${
                    item.direction === 'DEBIT' ? 'text-red-600' : 'text-navy-600'
                  }`}
                >
                  {item.direction === 'DEBIT' ? '−' : '+'}
                  {Number(item.amount).toLocaleString()}원
                </span>
              ),
            },
            {
              key: 'transactionId',
              header: '거래 ID',
              render: (item) => (
                <span className="mono text-[11.5px] text-ink-500">
                  {item.transactionId.length > 20
                    ? `${item.transactionId.slice(0, 18)}…`
                    : item.transactionId}
                </span>
              ),
            },
            {
              key: 'occurredAt',
              header: '발생일시',
              align: 'right',
              render: (item) => (
                <span className="text-ink-500">
                  {format(new Date(item.occurredAt), 'yyyy.MM.dd HH:mm:ss')}
                </span>
              ),
            },
          ]}
          data={entries}
          page={ledgerPage}
          totalPages={ledgerData?.totalPages || 0}
          totalElements={ledgerData?.totalElements || 0}
          onPageChange={setLedgerPage}
          loading={ledgerLoading}
          emptyMessage="조회 기간에 원장 기록이 없습니다"
        />
      )}

      {tab === 'eod' && (
        <DataTable
          columns={[
            {
              key: 'settlementDate',
              header: '정산일',
              render: (item) => <span className="font-medium text-ink-800">{item.settlementDate}</span>,
            },
            {
              key: 'closingBalance',
              header: '마감 잔액',
              align: 'right',
              render: (item) => (
                <span className="font-semibold text-ink-900">
                  {Number(item.closingBalance).toLocaleString()}원
                </span>
              ),
            },
            {
              key: 'interestValue',
              header: '일할 이자',
              align: 'right',
              render: (item) => (
                <span className={Number(item.interestAmount) > 0 ? 'text-emerald-700 font-medium' : 'text-ink-400'}>
                  {Number(item.interestAmount) > 0 ? '+' : ''}
                  {Number(item.interestAmount).toLocaleString()}원
                </span>
              ),
            },
            {
              key: 'computedAt',
              header: '계산일시',
              align: 'right',
              render: (item) => (
                <span className="text-ink-500">
                  {format(new Date(item.computedAt), 'yyyy.MM.dd HH:mm:ss')}
                </span>
              ),
            },
          ]}
          data={eodData?.content || []}
          page={eodPage}
          totalPages={eodData?.totalPages || 0}
          totalElements={eodData?.totalElements || 0}
          onPageChange={setEodPage}
          loading={eodLoading}
          emptyMessage="조회 기간에 EOD 스냅샷이 없습니다"
        />
      )}
    </div>
  );
}
