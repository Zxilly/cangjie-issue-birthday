import type { CSSProperties, MouseEventHandler } from 'react';
import { Ico } from './icons';
import { Cake } from './Cake';
import { COPY } from '../lib/copy';
import type { AppUser } from '../lib/types';

export function Brand({
  size = 'md',
  onClick,
}: {
  size?: 'md' | 'lg';
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <a className="brand" href="#" onClick={onClick}>
      <Cake size={size === 'lg' ? 26 : 22} />
      <span className="word">
        {COPY.brand}
        <span className="en">{COPY.brandEn}</span>
      </span>
    </a>
  );
}

export function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      className="icon-btn"
      onClick={onToggle}
      aria-label={dark ? '切换到亮色模式' : '切换到暗色模式'}
      title={dark ? '亮色' : '暗色'}
    >
      {dark ? <Ico.sun /> : <Ico.moon />}
    </button>
  );
}

export function Header({
  user,
  dark,
  onToggleTheme,
  onLogout,
  onHome,
}: {
  user: AppUser;
  dark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  onHome?: () => void;
}) {
  return (
    <header className="appbar">
      <div className="container appbar-inner">
        <Brand
          onClick={(e) => {
            e.preventDefault();
            onHome?.();
          }}
        />
        <div className="user-chip">
          <ThemeToggle dark={dark} onToggle={onToggleTheme} />
          {user.avatarUrl ? (
            // GitCode CDN（cdn-img.gitcode.com）对图片有防盗链：带 Referer 会 403，
            // 不带则 200。用 no-referrer 让 <img> 不发 Referer。
            <img className="avatar" src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />
          ) : (
            <div
              className="avatar"
              style={{ background: `oklch(62% 0.15 ${user.avatarHue})` } as CSSProperties}
            >
              {user.initials}
            </div>
          )}
          <span className="user-name">{user.name}</span>
          <button className="logout-btn" onClick={onLogout}>
            <Ico.logout /> 退出
          </button>
        </div>
      </div>
    </header>
  );
}
