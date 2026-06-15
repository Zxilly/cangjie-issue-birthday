import type { ReactNode } from 'react';
import { Ico } from './icons';
import type { ToastItem, ToastKind } from '../lib/types';

export function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  const icon: Record<ToastKind, ReactNode> = {
    success: <Ico.check />,
    error: <Ico.x />,
    warn: <Ico.warn width={18} height={18} />,
  };
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast t-${t.kind}`} role="status">
          <span className="tico">{icon[t.kind]}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
