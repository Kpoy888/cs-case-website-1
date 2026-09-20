import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface BalanceCtx {
  balance: number;
  activated: string[];
  topUp: (amount: number) => void;
  spend: (amount: number) => boolean;
  activatePromo: (code: string) => { ok: boolean; message: string };
}

const Ctx = createContext<BalanceCtx | null>(null);

const PROMO_BONUS: Record<string, number> = {
  NICE15: 150,
  DROP50: 50,
  GOLD25: 500,
};

export const BalanceProvider = ({ children }: { children: React.ReactNode }) => {
  const [balance, setBalance] = useState(15000);
  const [activated, setActivated] = useState<string[]>([]);

  const topUp = useCallback((amount: number) => {
    setBalance((b) => b + amount);
  }, []);

  const spend = useCallback((amount: number) => {
    let ok = false;
    setBalance((b) => {
      if (b >= amount) {
        ok = true;
        return b - amount;
      }
      return b;
    });
    return ok;
  }, []);

  const activatePromo = useCallback(
    (raw: string) => {
      const code = raw.trim().toUpperCase();
      if (!code) return { ok: false, message: 'Введите промокод' };
      if (!(code in PROMO_BONUS)) return { ok: false, message: 'Такого промокода не существует' };
      if (activated.includes(code)) return { ok: false, message: 'Этот промокод уже активирован' };
      setActivated((list) => [...list, code]);
      setBalance((b) => b + PROMO_BONUS[code]);
      return { ok: true, message: `Промокод ${code}: +${PROMO_BONUS[code]} ₽ на баланс` };
    },
    [activated],
  );

  const value = useMemo(
    () => ({ balance, activated, topUp, spend, activatePromo }),
    [balance, activated, topUp, spend, activatePromo],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useBalance = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useBalance must be used within BalanceProvider');
  return ctx;
};

export const formatMoney = (n: number) => n.toLocaleString('ru-RU') + ' ₽';