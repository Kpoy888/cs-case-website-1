import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { promos } from '@/data/nicedrop';
import { useBalance } from '@/hooks/use-balance';

const Bonuses = () => {
  const { activatePromo, activated } = useBalance();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = activatePromo(code);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setError('');
    setCode('');
    toast({ title: 'Промокод активирован', description: res.message });
  };

  const copy = (c: string) => {
    navigator.clipboard?.writeText(c);
    setCode(c);
    setError('');
    toast({ title: 'Код скопирован', description: `${c} вставлен в поле активации.` });
  };

  return (
    <section id="bonuses" className="scroll-mt-24">
      <div className="mb-4">
        <h2 className="font-display text-3xl uppercase tracking-[.02em] sm:text-4xl">
          Бонусы и <span className="text-primary">промокоды</span>
        </h2>
        <p className="mt-2 text-[.85em] font-bold text-muted-foreground">
          Активируйте код — бонус упадёт на баланс мгновенно.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="mb-4 flex flex-col gap-3 rounded-[var(--hero-radius)] border border-border bg-card p-4 sm:flex-row sm:items-center sm:p-5"
      >
        <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-background px-5 py-3">
          <Icon name="Ticket" size={18} className="text-muted-foreground" />
          <input
            ref={inputRef}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError('');
            }}
            placeholder="Введите промокод"
            className="w-full bg-transparent font-display text-[1em] tracking-[.1em] outline-none placeholder:font-body placeholder:tracking-normal placeholder:text-muted-foreground"
            aria-label="Промокод"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-primary px-8 py-3 font-display text-[1.05em] tracking-[.03em] text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          Активировать
        </button>
      </form>

      {error && (
        <p className="mb-4 flex items-center gap-1.5 text-[.78em] font-bold text-hot">
          <Icon name="TriangleAlert" size={14} />
          {error}
        </p>
      )}

      <div className="grid gap-3.5 md:grid-cols-3">
        {promos.map((p) => {
          const used = activated.includes(p.code);
          return (
            <div
              key={p.code}
              className="promo-card flex flex-col rounded-[var(--hero-radius)] border border-primary/30 p-5"
            >
              <span className="mb-3 w-fit rounded-full bg-primary/15 px-3 py-1 text-[.68em] font-black uppercase tracking-[.16em] text-primary">
                {p.badge}
              </span>
              <b className="font-display text-2xl leading-none tracking-[.02em] text-primary">
                {p.title}
              </b>
              <p className="mt-2 flex-1 text-[.8em] font-bold leading-[1.4] text-muted-foreground">
                {p.text}
              </p>
              <button
                onClick={() => copy(p.code)}
                disabled={used}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/55 p-2.5 font-display text-[1em] tracking-[.14em] text-foreground transition-colors hover:bg-primary/10 disabled:opacity-40"
              >
                {used ? 'Активирован' : p.code}
                {!used && <Icon name="Copy" size={14} className="text-muted-foreground" />}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Bonuses;