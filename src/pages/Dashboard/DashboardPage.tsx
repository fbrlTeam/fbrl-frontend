import { format } from 'date-fns';
import { ShieldCheck, Activity, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePendingApprovals, useAuditEvents, useBatchJobExecutions } from '../../hooks/queries';
import StatusBadge from '../../components/common/StatusBadge';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: pending } = usePendingApprovals();
  const { data: auditData } = useAuditEvents(0, 5);
  const { data: eodBatch } = useBatchJobExecutions('eodSettlementJob', 0, 1);
  const { data: reconBatch } = useBatchJobExecutions('reconciliationJob', 0, 1);

  const latestEod = eodBatch?.content?.[0];
  const latestRecon = reconBatch?.content?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">대시보드</h2>
        <p className="text-sm text-gray-400 mt-1">시스템 현황을 한눈에 확인하세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/approvals')}
          className="bg-white rounded-2xl border border-gray-100 p-5 text-left hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <ShieldCheck size={20} className="text-amber-500" />
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all duration-200" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{pending?.length ?? '-'}</p>
          <p className="text-xs text-gray-400 mt-1">대기 중인 승인</p>
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Activity size={20} className="text-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={latestEod?.status ?? '-'} type="batch" />
          </div>
          <p className="text-xs text-gray-400 mt-2">EOD 정산 배치</p>
          {latestEod?.startTime && (
            <p className="text-xs text-gray-300 mt-0.5">
              {format(new Date(latestEod.startTime), 'MM.dd HH:mm')}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Activity size={20} className="text-purple-500" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={latestRecon?.status ?? '-'} type="batch" />
          </div>
          <p className="text-xs text-gray-400 mt-2">대사 배치</p>
          {latestRecon?.startTime && (
            <p className="text-xs text-gray-300 mt-0.5">
              {format(new Date(latestRecon.startTime), 'MM.dd HH:mm')}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">대기 승인</h3>
            <button
              onClick={() => navigate('/approvals')}
              className="text-xs text-blue-500 hover:text-blue-600 transition-colors duration-150"
            >
              전체보기
            </button>
          </div>
          {!pending || pending.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle size={24} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">처리할 승인 건이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pending.slice(0, 4).map((item) => (
                <button
                  key={item.requestId}
                  onClick={() => navigate(`/approvals/${item.requestId}`)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="text-left">
                    <p className="text-sm text-gray-900 font-medium">
                      {item.fromAccountNumber} → {item.toAccountNumber}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {Number(item.amount).toLocaleString()}원 · {item.makerId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-amber-400" />
                    <span className="text-xs text-gray-400">
                      {format(new Date(item.requestedAt), 'MM.dd HH:mm')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">최근 감사 이벤트</h3>
            <button
              onClick={() => navigate('/audit-log')}
              className="text-xs text-blue-500 hover:text-blue-600 transition-colors duration-150"
            >
              전체보기
            </button>
          </div>
          {!auditData || auditData.content.length === 0 ? (
            <div className="py-8 text-center">
              <XCircle size={24} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">이벤트가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {auditData.content.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-xl"
                >
                  <div>
                    <p className="text-sm text-gray-900 font-medium">{event.eventType}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{event.aggregateType} · {event.aggregateId}</p>
                  </div>
                  <span className="text-xs text-gray-300">
                    {format(new Date(event.createdAt), 'HH:mm:ss')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
