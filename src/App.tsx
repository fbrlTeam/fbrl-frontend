import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, ProtectedRoute, DemoRoute } from './contexts/AuthContext';
import { DemoSessionProvider } from './contexts/DemoSessionContext';
import MainLayout from './components/Layout/MainLayout';
import DemoLayout from './components/Layout/DemoLayout';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import AccountsPage from './pages/Accounts/AccountsPage';
import AccountDetailPage from './pages/Accounts/AccountDetailPage';
import TransferPage from './pages/Transfer/TransferPage';
import ApprovalsPage from './pages/Approvals/ApprovalsPage';
import ApprovalDetailPage from './pages/Approvals/ApprovalDetailPage';
import EodSettlementPage from './pages/EodSettlement/EodSettlementPage';
import ReconciliationPage from './pages/Reconciliation/ReconciliationPage';
import BatchJobsPage from './pages/BatchJobs/BatchJobsPage';
import AuditLogPage from './pages/AuditLog/AuditLogPage';
import ReliabilityPage from './pages/Reliability/ReliabilityPage';
import DemoHomePage from './pages/Demo/DemoHomePage';
import DemoAccountsPage from './pages/Demo/DemoAccountsPage';
import DemoTransferPage from './pages/Demo/DemoTransferPage';
import DemoApprovalsPage from './pages/Demo/DemoApprovalsPage';
import DemoBatchPage from './pages/Demo/DemoBatchPage';
import DemoAuditPage from './pages/Demo/DemoAuditPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <DemoSessionProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/accounts/:accountNumber" element={<AccountDetailPage />} />
                <Route path="/transfer" element={<TransferPage />} />
                <Route path="/approvals" element={<ApprovalsPage />} />
                <Route path="/approvals/:requestId" element={<ApprovalDetailPage />} />
                <Route path="/eod-settlement" element={<EodSettlementPage />} />
                <Route path="/reconciliation" element={<ReconciliationPage />} />
                <Route path="/batch-jobs" element={<BatchJobsPage />} />
                <Route path="/audit-log" element={<AuditLogPage />} />
                <Route path="/reliability" element={<ReliabilityPage />} />
              </Route>
              <Route
                element={
                  <DemoRoute>
                    <DemoLayout />
                  </DemoRoute>
                }
              >
                <Route path="/demo" element={<DemoHomePage />} />
                <Route path="/demo/accounts" element={<DemoAccountsPage />} />
                <Route path="/demo/transfer" element={<DemoTransferPage />} />
                <Route path="/demo/approvals" element={<DemoApprovalsPage />} />
                <Route path="/demo/batch" element={<DemoBatchPage />} />
                <Route path="/demo/audit" element={<DemoAuditPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DemoSessionProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
