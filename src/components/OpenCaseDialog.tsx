import { CSSProperties, useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import SpinReel from '@/components/SpinReel';
import { CaseItem, rarityArt, rarityColor, rarityVar } from '@/data/nicedrop';
import { skinArt } from '@/data/skins';
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
  const [prizeValue, setPrizeValue] = useState(0);

  useEffect(() => {
    if (item) {
      setPhase('confirm');
      setPrize('');
    }
  }, [item]);

  if (!item) return null;

  const start = () => {
    if (balance < item.price) {
      setPhase('nomoney');
      return;
    }
    spend(item.price);
    setPrize(item.drops[Math.floor(Math.random() * item.drops.length)]);

    const lucky = Math.random() < 0.1;
    const value = lucky
      ? Math.round(220 + Math.random() * Math.max(400, item.price * 6))
      : Math.round(30 + Math.random() * 170);
    setPrizeValue(value);
    setPhase('spin');
  };

  const prizeSkin = skinArt[prize];

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        style={{ '--c': rarityVar[item.rarity] } as CSSProperties}
        className={`overflow-hidden border-border bg-card text-center ${
          phase === 'spin' ? 'max-w-3xl' : 'max-w-md'
        }`}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--c) / .35), transparent 70%)',
          }}
        />

        <div className="relative">
          <div className="text-[.68em] font-black uppercase tracking-[.16em] text-[hsl(var(--c))]">
            {item.rarityLabel}
          </div>
          <h3 className="mt-1 font-display text-3xl uppercase tracking-[.02em]">{item.name}</h3>

          {phase === 'confirm' && (
            <div className="animate-fade-in">
              <div className="my-6 flex justify-center">
                <img
                  src={rarityArt[item.rarity]}
                  alt={`Кейс ${item.name}`}
                  className="h-44 w-44 object-contain mix-blend-screen drop-shadow-[0_16px_28px_rgba(0,0,0,.7)]"
                />
              </div>
              <div className="mb-4 flex flex-wrap justify-center gap-2">
                {item.drops.map((d) => {
                  const s = skinArt[d];
                  return (
                    <div
                      key={d}
                      style={{ '--sc': rarityColor(s?.rarity) } as CSSProperties}
                      className="flex w-[104px] flex-col items-center rounded-xl border border-[hsl(var(--sc))]/35 bg-[hsl(var(--sc))]/[.08] p-1.5"
                    >
                      <img src={s?.img} alt={d} loading="lazy" className="h-12 object-contain" />
                      <span className="mt-1 w-full truncate text-[10px] font-bold text-muted-foreground">
                        {d.replace(' · ', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[.8em] font-bold text-muted-foreground">{item.odds}</p>
              <button
                onClick={start}
                className="mt-4 w-full rounded-full bg-primary px-6 py-3 font-display text-lg tracking-[.03em] text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                Открыть за {formatMoney(item.price)}
              </button>
              <p className="mt-3 text-[.75em] font-bold text-muted-foreground">
                На балансе {formatMoney(balance)}
              </p>
            </div>
          )}

          {phase === 'spin' && (
            <div className="my-6 animate-fade-in">
              <SpinReel
                pool={item.drops}
                prize={prize}
                spinning
                onDone={() => setPhase('result')}
              />
              <p className="mt-4 text-[.85em] font-extrabold uppercase tracking-[.2em] text-muted-foreground">
                Крутим…
              </p>
            </div>
          )}

          {phase === 'result' && (
            <div className="mt-5 animate-scale-in">
              <div
                style={{ '--sc': rarityColor(prizeSkin?.rarity) } as CSSProperties}
                className="rounded-2xl border border-[hsl(var(--sc))]/50 bg-[hsl(var(--sc))]/[.08] p-5"
              >
                <div className="text-[.7em] font-black uppercase tracking-[.2em] text-muted-foreground">
                  Ваш дроп
                </div>
                <img
                  src={prizeSkin?.img}
                  alt={prize}
                  className="mx-auto my-3 h-28 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,.6)]"
                />
                <div className="font-display text-2xl uppercase text-[hsl(var(--sc))]">{prize}</div>
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
            <div className="mt-5 animate-fade-in">
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