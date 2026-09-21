import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { navLinks } from '@/data/nicedrop';
import { formatMoney, useBalance } from '@/hooks/use-balance';
import { useAuth } from '@/hooks/use-auth';
import AuthDialog from '@/components/AuthDialog';

const Header = () => {
  const { balance } = useBalance();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [auth, setAuth] = useState<'login' | 'register' | null>(null);
  const navigate = useNavigate();

  return (
    <header>
      <div className="flex items-center gap-6 border-b border-border px-1.5 pb-3">
        <Link
          to="/"
          className="flex shrink-0 items-baseline gap-2.5"
          aria-label="Nicedrop — на главную"
        >
          <span className="font-display text-[1.55em] leading-none tracking-[.02em] text-foreground">
            NICE<span className="text-primary">DROP</span>
          </span>
          <span className="hidden text-[.62em] font-bold uppercase tracking-[.22em] text-muted-foreground sm:block">
            CS2 CASES
          </span>
        </Link>

        <ul className="ml-2 hidden gap-6 lg:flex">
          {navLinks.map((l) => (
            <li key={l.id}>
              <NavLink
                to={l.path}
                end={l.path === '/'}
                className={({ isActive }) =>
                  `text-[.88em] font-bold transition-colors hover:text-foreground ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-[.88em] font-extrabold">
            <span className="hidden font-bold text-muted-foreground sm:inline">Баланс</span>
            <span className="tabular-nums">{formatMoney(balance)}</span>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-[.85em] font-extrabold sm:flex">
                <Icon name="User" size={15} className="text-primary" />
                {user.nickname}
              </span>
              <button
                onClick={logout}
                className="rounded-full border border-border bg-card p-2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Выйти"
              >
                <Icon name="LogOut" size={17} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuth('register')}
              className="rounded-full border border-border bg-card px-4 py-2.5 text-[.85em] font-extrabold text-foreground transition-colors hover:border-primary/40"
            >
              Войти
            </button>
          )}

          <button
            onClick={() => navigate('/topup')}
            className="rounded-full bg-primary px-5 py-2.5 font-display text-[.95em] tracking-[.03em] text-primary-foreground shadow-[0_8px_26px_hsl(var(--primary)/0.28)] transition-transform hover:scale-105"
          >
            Пополнить
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-full border border-border bg-card p-2 text-foreground lg:hidden"
            aria-label="Меню"
          >
            <Icon name={open ? 'X' : 'Menu'} size={18} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="mt-3 animate-fade-in rounded-2xl border border-border bg-card p-2 lg:hidden">
          {navLinks.map((l) => (
            <NavLink
              key={l.id}
              to={l.path}
              end={l.path === '/'}
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-[.95em] font-bold text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {l.label}
              <Icon name="ChevronRight" size={16} />
            </NavLink>
          ))}
        </nav>
      )}

      <AuthDialog
        open={auth !== null}
        initialMode={auth ?? 'login'}
        onClose={() => setAuth(null)}
      />
    </header>
  );
};

export default Header;