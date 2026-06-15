import { Cake } from '../components/Cake';
import { COPY } from '../lib/copy';

/** S2 · 登录过渡态（换取 token 期间） */
export function LoginLoading() {
  return (
    <div className="center-screen full bg-festive">
      <div className="candle-spin">
        <Cake size={40} />
      </div>
      <div>
        <h2 style={{ marginBottom: 8 }}>{COPY.loginLoading}</h2>
        <p>{COPY.loginLoadingSub}</p>
      </div>
    </div>
  );
}
