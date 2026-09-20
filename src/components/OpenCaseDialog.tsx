import { CSSProperties, useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import CrateIcon from '@/components/CrateIcon';
import { CaseItem, rarityVar } from '@/data/nicedrop';
import { formatMoney, useBalance } from '@/hooks/use-balance';

interface Props {
  item: CaseItem | null;
  onClose: () => void;
}

type Phase = 'confirm' | 'spin' | 'result' | 'nomoney';

const OpenCaseDialog = ({ item, onClose }: Props) => {
  const { balance, spend, topUp } = useBalance();
  const [phase, setPhase] = useState<Phase>('confirm');
  const [prize, setPrize] = useState<string>('');

  useEffect(() => {
    if (item) {
      setPhase('confirm');
      setPrize('');
    }
  }, [item]);

  useEffect(() => {
    if (phase !== 'spin' || !item) return;
    const t = setTimeout(() => {
      setPrize(item.drops[Math.floor(Math.random() * item.drops.length)]);
      setPhase('result');
    }, 2200);
    return () => clearTimeout(t);
  }, [phase, item]);

  if (!item) return null;

  const start = () => {
    if (balance < item.price) {
      setPhase('nomoney');
      return;
    }
    spend(item.price);
    setPhase('spin');
  };

  const prizeValue = Math.round(item.price * (0.4 + Math.random() * 4));

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        style={{ '--c': rarityVar[item.rarity] } as CSSProperties}
        className="max-w-md overflow-hidden border-border bg-card text-center"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, hsl(var(--c) / .35), transparent 70%)',
          }}
        />

        <div className="relative">
          <div className="text-[.68em] font-black uppercase tracking-[.16em] text-[hsl(var(--c))]">
            {item.rarityLabel}
          </div>
          <h3 className="mt-1 font-display text-3xl uppercase tracking-[.02em]">{item.name}</h3>

          <div className="my-6 flex justify-center">
            <CrateIcon
              className={`w-40 drop-shadow-[0_16px_28px_rgba(0,0,0,.7)] ${
                phase === 'spin' ? 'animate-pulse-dot' : ''
              }`}
            />
          </div>

          {phase === 'confirm' && (
            <div className="animate-fade-in">
              <p className="text-[.85em] font-bold text-muted-foreground">
                {item.odds} · возможный дроп: {item.drops.slice(0, 2).join(', ')}…
              </p>
              <button
                onClick={start}
                className="mt-5 w-full rounded-full bg-primary px-6 py-3 font-display text-lg tracking-[.03em] text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                Открыть за {formatMoney(item.price)}
              </button>
              <p className="mt-3 text-[.75em] font-bold text-muted-foreground">
                На балансе {formatMoney(balance)}
              </p>
            </div>
          )}

          {phase === 'spin' && (
            <div className="animate-fade-in">
              <div className="mx-auto h-1.5 w-56 overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-1/3 animate-marquee rounded-full bg-[hsl(var(--c))]" />
              </div>
              <p className="mt-4 text-[.85em] font-extrabold uppercase tracking-[.2em] text-muted-foreground">
                Крутим…
              </p>
            </div>
          )}

          {phase === 'result' && (
            <div className="animate-scale-in">
              <div className="rounded-2xl border border-[hsl(var(--c))]/40 bg-background/60 p-5">
                <div className="text-[.7em] font-black uppercase tracking-[.2em] text-muted-foreground">
                  Ваш дроп
                </div>
                <div className="mt-2 font-display text-2xl uppercase text-[hsl(var(--c))]">
                  {prize}
                </div>
                <div className="mt-1 text-[.85em] font-extrabold text-primary">
                  ≈ {formatMoney(prizeValue)}
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => {
                    topUp(prizeValue);
                    onClose();
                  }}
                  className="flex-1 rounded-full border border-border bg-secondary py-3 text-[.85em] font-extrabold text-foreground transition-colors hover:bg-secondary/70"
                >
                  Продать
                </button>
                <button
                  onClick={() => setPhase('confirm')}
                  className="flex-1 rounded-full bg-primary py-3 font-display text-[1em] tracking-[.03em] text-primary-foreground transition-transform hover:scale-[1.02]"
                >
                  Ещё раз
                </button>
              </div>
            </div>
          )}

          {phase === 'nomoney' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-center gap-2 text-hot">
                <Icon name="TriangleAlert" size={18} />
                <span className="text-[.9em] font-extrabold">Недостаточно средств</span>
              </div>
              <p className="mt-2 text-[.8em] font-bold text-muted-foreground">
                Нужно {formatMoney(item.price)}, а на балансе {formatMoney(balance)}.
              </p>
              <button
                onClick={() => {
                  onClose();
                  document.getElementById('topup')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mt-5 w-full rounded-full bg-primary px-6 py-3 font-display text-lg tracking-[.03em] text-primary-foreground"
              >
                Пополнить баланс
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OpenCaseDialog;
