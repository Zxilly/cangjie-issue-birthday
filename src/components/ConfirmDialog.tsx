import { useEffect, useRef } from 'react';
import { Cake } from './Cake';
import { blessingFor } from '../lib/cake';
import { COPY } from '../lib/copy';
import type { Issue } from '../lib/types';

/** 送蛋糕前的确认弹窗：预览祝福语 + 取消 / 确认送出 */
export function ConfirmDialog({
  issue,
  onConfirm,
  onCancel,
}: {
  issue: Issue | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!issue) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector<HTMLButtonElement>('.dlg-confirm')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [issue, onCancel]);

  if (!issue) return null;

  return (
    <div
      className="dlg-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="dlg" role="dialog" aria-modal="true" aria-label="确认送蛋糕" ref={ref}>
        <div className="dlg-head">
          <Cake size={22} />
          <div>
            <div className="dlg-title">给这个 issue 送上生日蛋糕</div>
            <div className="dlg-sub mono">
              {issue.repo} · #{issue.number} · {issue.age} 周岁
            </div>
          </div>
        </div>
        <div className="dlg-quote">
          <span className="dlg-quote-label">{COPY.previewLabel}</span>
          <p>{blessingFor(issue.age)}</p>
        </div>
        <div className="dlg-actions">
          <button className="btn btn-ghost" onClick={onCancel}>
            取消
          </button>
          <button className="btn btn-primary dlg-confirm" onClick={onConfirm}>
            确认送出
          </button>
        </div>
      </div>
    </div>
  );
}
