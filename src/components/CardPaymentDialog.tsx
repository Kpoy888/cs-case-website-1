import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { formatMoney } from '@/hooks/use-balance';

const CARD_NUMBER = '2204240276005867';
const CARD_HOLDER = 'Nicedrop';
const PAY_MINUTES = 15;

interface Props {
  open: boolean;
  amount: number;
  total: number;
  onClose: () => void;
  onPaid: () => void;
}

const pretty = (n: string) => n.replace(/(\d{4})(?=\d)/g, '$1 ');

const CardPaymentDialog = ({ open, amount, total, onClose, onPaid }: Props) => {
  const [left, setLeft] = useState(PAY_MINUTES * 60);
  const [checking, setChecking] = useState(false);
  const [orderId] = useState(() => String(Math.floor(100000 + Math.random() * 900000)));

  useEffect(() => {
    if (!open) return;
    setLeft(PAY_MINUTES * 60);
    setChecking(false);
    const t = setInterval(() => setLeft((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [open]);

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast({ title: 'Скопировано', description: label });
  };

  const confirm = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      onPaid();
    }, 1800);
  };

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md border-border bg-card">
        <div className="text-center">
          <div className="text-[.68em] font-black uppercase tracking-[.16em] text-primary">
            Оплата картой
          </div>
          <h3 className="mt-1 font-display text-3xl uppercase tracking-[.02em]">
            {formatMoney(amount)}
          </h3>
          <p className="mt-1 text-[.8em] font-bold text-muted-foreground">
            На баланс зачислим {formatMoney(total)} · заявка №{orderId}
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-primary/35 bg-background p-4">
          <div className="text-[.7em] font-black uppercase tracking-[.18em] text-muted-foreground">
            Номер карты
          </div>
          <button
            onClick={() => copy(CARD_NUMBER, 'Номер карты')}
            className="mt-1.5 flex w-full items-center justify-between gap-3 text-left"
          >
            <span className="font-display text-[1.45em] tracking-[.08em] text-foreground">
              {pretty(CARD_NUMBER)}
            </span>
            <Icon name="Copy" size={18} className="shrink-0 text-primary" />
          </button>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[.8em] font-bold">
            <span className="text-muted-foreground">Получатель</span>
            <span className="text-foreground">{CARD_HOLDER}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[.8em] font-bold">
            <span className="text-muted-foreground">Сумма перевода</span>
            <button
              onClick={() => copy(String(amount), 'Сумма перевода')}
              className="flex items-center gap-1.5 text-primary"
            >
              {formatMoney(amount)}
              <Icon name="Copy" size={14} />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between text-[.8em] font-bold">
            <span className="text-muted-foreground">Комментарий к переводу</span>
            <button
              onClick={() => copy(orderId, 'Комментарий к переводу')}
              className="flex items-center gap-1.5 text-primary"
            >
              {orderId}
              <Icon name="Copy" size={14} />
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 text-[.78em] font-extrabold text-muted-foreground">
          <Icon name="Clock" size={15} className="text-primary" />
          Реквизиты действительны {mm}:{ss}
        </div>

        <p className="mt-2 text-center text-[.74em] font-bold leading-[1.45] text-muted-foreground">
          Переведите точную сумму на карту и нажмите «Я оплатил» — средства зачислим после
          подтверждения перевода.
        </p>

        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-border bg-secondary py-3 text-[.85em] font-extrabold text-foreground transition-colors hover:bg-secondary/70"
          >
            Отмена
          </button>
          <button
            onClick={confirm}
            disabled={checking || left === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 font-display text-[1em] tracking-[.03em] text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {checking ? (
              <>
                <Icon name="LoaderCircle" size={16} className="animate-spin" />
                Проверяем
              </>
            ) : (
              'Я оплатил'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardPaymentDialog;
