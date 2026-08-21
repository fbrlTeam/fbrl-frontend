import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4 pb-4 mb-5 border-b border-line">
      <div>
        <h1 className="text-[19px] font-bold text-ink-900 tracking-tight">{title}</h1>
        {description && <p className="text-[12.5px] text-ink-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
