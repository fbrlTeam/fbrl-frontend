import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

/**
 * 데모 백엔드엔 "내가 만든 계좌 목록"을 조회하는 API가 없다 (POST만 있고 GET이 없음).
 * 그래서 이 브라우저 세션에서 만든 계좌/승인 요청을 로컬에 기억해뒀다가 보여준다 —
 * 서버 상태가 아니라 "이 세션에서 뭘 해봤는지"에 대한 로컬 기록.
 * 데모 데이터는 30분마다 서버에서 통째로 리셋되므로 새로고침 시 오래된 기록은 알아서 무의미해진다.
 */

export interface DemoAccountRecord {
  accountNumber: string;
  createdAt: string;
}

export interface DemoApprovalRecord {
  requestId: string;
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  createdAt: string;
}

interface DemoSessionContextType {
  accounts: DemoAccountRecord[];
  approvals: DemoApprovalRecord[];
  addAccount: (accountNumber: string) => void;
  addApproval: (record: DemoApprovalRecord) => void;
  clear: () => void;
}

const STORAGE_KEY = 'fbrl_demo_session';

function load(): { accounts: DemoAccountRecord[]; approvals: DemoApprovalRecord[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { accounts: [], approvals: [] };
    const parsed = JSON.parse(raw);
    return { accounts: parsed.accounts ?? [], approvals: parsed.approvals ?? [] };
  } catch {
    return { accounts: [], approvals: [] };
  }
}

const DemoSessionContext = createContext<DemoSessionContextType | null>(null);

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<DemoAccountRecord[]>(() => load().accounts);
  const [approvals, setApprovals] = useState<DemoApprovalRecord[]>(() => load().approvals);

  const persist = useCallback((next: { accounts: DemoAccountRecord[]; approvals: DemoApprovalRecord[] }) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addAccount = useCallback(
    (accountNumber: string) => {
      setAccounts((prev) => {
        const next = [{ accountNumber, createdAt: new Date().toISOString() }, ...prev];
        persist({ accounts: next, approvals });
        return next;
      });
    },
    [approvals, persist]
  );

  const addApproval = useCallback(
    (record: DemoApprovalRecord) => {
      setApprovals((prev) => {
        const next = [record, ...prev];
        persist({ accounts, approvals: next });
        return next;
      });
    },
    [accounts, persist]
  );

  const clear = useCallback(() => {
    setAccounts([]);
    setApprovals([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <DemoSessionContext.Provider value={{ accounts, approvals, addAccount, addApproval, clear }}>
      {children}
    </DemoSessionContext.Provider>
  );
}

export function useDemoSession() {
  const ctx = useContext(DemoSessionContext);
  if (!ctx) throw new Error('useDemoSession must be used within DemoSessionProvider');
  return ctx;
}
