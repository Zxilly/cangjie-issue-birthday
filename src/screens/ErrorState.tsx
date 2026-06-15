import type { ReactNode } from 'react';
import { Ico } from '../components/icons';
import { COPY } from '../lib/copy';
import type { ErrorKind } from '../lib/types';

interface ErrEntry {
  disc: string;
  icon: ReactNode;
  title: string;
  body: string;
  btn: string;
}

/** S3-c · 错误态：登录失效 / 加载失败 / 触发限流（官方口吻） */
export function ErrorState({ kind, onAction }: { kind: ErrorKind; onAction: () => void }) {
  const map: Record<ErrorKind, ErrEntry> = {
    expired: {
      disc: 'expired',
      icon: <Ico.logout width={28} height={28} />,
      title: COPY.errExpiredTitle,
      body: COPY.errExpiredBody,
      btn: COPY.errExpiredBtn,
    },
    load: {
      disc: 'bad',
      icon: <Ico.bad />,
      title: COPY.errLoadTitle,
      body: COPY.errLoadBody,
      btn: COPY.errLoadBtn,
    },
    rate: {
      disc: 'warn',
      icon: <Ico.warn />,
      title: COPY.errRateTitle,
      body: COPY.errRateBody,
      btn: COPY.errRateBtn,
    },
  };
  const m = map[kind];
  return (
    <div className="center-screen">
      <div className={`err-disc ${m.disc}`}>{m.icon}</div>
      <div>
        <h2 style={{ marginBottom: 10 }}>{m.title}</h2>
        <p>{m.body}</p>
      </div>
      <button className={`btn ${kind === 'expired' ? 'btn-primary' : 'btn-soft'}`} onClick={onAction}>
        {kind !== 'expired' && <Ico.retry />} {m.btn}
      </button>
    </div>
  );
}
