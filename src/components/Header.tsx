import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { navLinks } from '@/data/nicedrop';
import { formatMoney, useBalance } from '@/hooks/use-balance';

const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const Header = () => {
  const { balance } = useBalance();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('cases');

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    navLinks.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const go = (id: string) => {
    setOpen(false);
    scrollTo(id);
  };

  return (
    <header>
      <div className="flex items-center gap-6 border-b border-border px-1.5 pb-3">
        <button
          onClick={() => go('cases')}
          className="flex items-baseline gap-2.5 shrink-0"
          aria-label="Nicedrop — на главную"
        >
          <span className="font-display text-[1.55em] leading-none tracking-[.02em] text-foreground">
            NICE<span className="text-primary">DROP</span>
          </span>
          <span className="hidden text-[.62em] font-bold uppercase tracking-[.22em] text-muted-foreground sm:block">
            CS2 CASES
          </span>
        </button>

        <ul className="ml-2 hidden gap-6 lg:flex">
          {navLinks.map((l) => (
            <li key={l.id}>
              <button
                onClick={() => go(l.id)}
                className={`text-[.88em] font-bold transition-colors hover:text-foreground ${
                  active === l.id ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-[.88em] font-extrabold">
            <span className="hidden font-bold text-muted-foreground sm:inline">Баланс</span>
            <span className="tabular-nums">{formatMoney(balance)}</span>
          </div>
          <button
            onClick={() => go('topup')}
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
            <button
              key={l.id}
              onClick={() => go(l.id)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-[.95em] font-bold text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {l.label}
              <Icon name="ChevronRight" size={16} />
            </button>
          ))}
        </nav>
      )}
    </header>
  );
};

export default Header;