import type { ReactNode } from 'react';
import { Ico } from './icons';
import { COPY } from '../lib/copy';
import type { CakeButtonState } from '../lib/types';

/** 送蛋糕按钮状态机：idle | checking | sending | sent | failed */
export function CakeButton({ state, onSend }: { state: CakeButtonState; onSend: () => void }) {
  const disabled = state === 'checking' || state === 'sending' || state === 'sent';

  let cls = 'cake-btn ';
  if (state === 'idle') cls += 'st-idle';
  else if (state === 'checking' || state === 'sending') cls += 'st-busy';
  else if (state === 'sent') cls += 'st-sent';
  else cls += 'st-failed';

  let content: ReactNode;
  if (state === 'idle') content = <span>{COPY.btnIdle}</span>;
  else if (state === 'checking') content = (<><span className="spinner" /><span>{COPY.btnChecking}</span></>);
  else if (state === 'sending') content = (<><span className="spinner" /><span>{COPY.btnSending}</span></>);
  else if (state === 'sent') content = (<><span className="check-icon"><Ico.check /></span><span>{COPY.btnSent}</span></>);
  else content = (<><Ico.retry /><span>{COPY.btnFailed}</span></>);

  const label =
    state === 'sent' ? '已送达蛋糕，不可重复发送'
    : state === 'failed' ? '发送失败，点击重试'
    : state === 'idle' ? '送蛋糕'
    : COPY.btnChecking;

  return (
    <button
      className={cls}
      disabled={disabled}
      aria-disabled={disabled}
      aria-label={label}
      onClick={() => {
        if (state === 'idle' || state === 'failed') onSend();
      }}
    >
      {content}
    </button>
  );
}
