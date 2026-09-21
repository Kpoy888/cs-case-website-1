import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { formatMoney } from '@/hooks/use-balance';
import { fileToDataUrl } from '@/hooks/use-topup';

const CARD_NUMBER = '2204240276005867';
const CARD_HOLDER = 'Nicedrop';
const PAY_MINUTES = 15;
const MAX_MB = 6;

interface Props {
  open: boolean;
  amount: number;
  total: number;
  onClose: () => void;
  onSubmit: (receipt: string) => Promise<string>;
}

const pretty = (n: string) => n.replace(/(\d{4})(?=\d)/g, '$1 ');

const CardPaymentDialog = ({ open, amount, total, onClose, onSubmit }: Props) => {
  const [left, setLeft] = useState(PAY_MINUTES * 60);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLeft(PAY_MINUTES * 60);
    setSending(false);
    setError('');
    setFile(null);
    setPreview('');
    setDone(false);
    const t = setInterval(() => setLeft((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [open]);

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast({ title: 'Скопировано', description: label });
  };

  const pick = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`Файл больше ${MAX_MB} МБ — сожмите фото`);
      return;
    }
    setError('');
    setFile(f);
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : '');
  };

  const send = async () => {
    if (!file) {
      setError('Приложите фото выписки из банка');
      return;
    }
    setSending(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const err = await onSubmit(dataUrl);
      if (err) {
        setError(err);
        return;
      }
      setDone(true);
    } catch {
      setError('Не удалось прочитать файл, попробуйте другое фото');
    } finally {
      setSending(false);
    }
  };

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto border-border bg-card">
        {done ? (
          <div className="py-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
              <Icon name="Clock" size={26} className="text-primary" />
            </div>
            <h3 className="mt-4 font-display text-2xl uppercase tracking-[.02em]">
              Заявка на проверке
            </h3>
            <p className="mt-2 text-[.82em] font-bold leading-[1.5] text-muted-foreground">
              Выписка отправлена. Обычно проверяем за 5–15 минут — как только перевод подтвердится,
              {' '}
              {formatMoney(total)} упадут на баланс.
            </p>
            <button
              onClick={onClose}
              className="mt-5 w-full rounded-full bg-primary py-3 font-display text-[1.05em] tracking-[.03em] text-primary-foreground"
            >
              Понятно
            </button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="text-[.68em] font-black uppercase tracking-[.16em] text-primary">
                Оплата картой
              </div>
              <h3 className="mt-1 font-display text-3xl uppercase tracking-[.02em]">
                {formatMoney(amount)}
              </h3>
              <p className="mt-1 text-[.8em] font-bold text-muted-foreground">
                На баланс зачислим {formatMoney(total)} после проверки перевода
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-primary/35 bg-background p-4">
              <div className="text-[.7em] font-black uppercase tracking-[.18em] text-muted-foreground">
                Шаг 1 · переведите на карту
              </div>
              <button
                onClick={() => copy(CARD_NUMBER, 'Номер карты')}
                className="mt-1.5 flex w-full items-center justify-between gap-3 text-left"
              >
                <span className="font-display text-[1.4em] tracking-[.08em] text-foreground">
                  {pretty(CARD_NUMBER)}
                </span>
                <Icon name="Copy" size={18} className="shrink-0 text-primary" />
              </button>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[.8em] font-bold">
                <span className="text-muted-foreground">Получатель</span>
                <span className="text-foreground">{CARD_HOLDER}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[.8em] font-bold">
                <span className="text-muted-foreground">Точная сумма</span>
                <button
                  onClick={() => copy(String(amount), 'Сумма перевода')}
                  className="flex items-center gap-1.5 text-primary"
                >
                  {formatMoney(amount)}
                  <Icon name="Copy" size={14} />
                </button>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-border bg-background p-4">
              <div className="text-[.7em] font-black uppercase tracking-[.18em] text-muted-foreground">
                Шаг 2 · приложите выписку из банка
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => pick(e.target.files?.[0] || null)}
              />

              {file ? (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-primary/35 bg-primary/[.07] p-3">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Выписка"
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <Icon name="FileText" size={22} className="text-primary" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[.82em] font-extrabold">{file.name}</div>
                    <div className="text-[.72em] font-bold text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} МБ
                    </div>
                  </div>
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="shrink-0 text-[.75em] font-extrabold text-primary"
                  >
                    Заменить
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => inputRef.current?.click()}
                  className="mt-3 flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed border-primary/45 p-5 transition-colors hover:bg-primary/[.06]"
                >
                  <Icon name="Upload" size={22} className="text-primary" />
                  <span className="text-[.85em] font-extrabold">Загрузить фото выписки</span>
                  <span className="text-[.72em] font-bold text-muted-foreground">
                    JPG, PNG, WEBP или PDF до {MAX_MB} МБ
                  </span>
                </button>
              )}

              <p className="mt-3 text-[.72em] font-bold leading-[1.45] text-muted-foreground">
                На выписке должны быть видны сумма, дата и последние цифры карты получателя.
                Скриншоты с обрезанной суммой не принимаем.
              </p>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 text-[.78em] font-extrabold text-muted-foreground">
              <Icon name="Clock" size={15} className="text-primary" />
              Реквизиты действительны {mm}:{ss}
            </div>

            {error && (
              <p className="mt-2 flex items-center gap-1.5 text-[.78em] font-bold text-hot">
                <Icon name="TriangleAlert" size={14} />
                {error}
              </p>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-full border border-border bg-secondary py-3 text-[.85em] font-extrabold text-foreground transition-colors hover:bg-secondary/70"
              >
                Отмена
              </button>
              <button
                onClick={send}
                disabled={sending || left === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 font-display text-[1em] tracking-[.03em] text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Icon name="LoaderCircle" size={16} className="animate-spin" />
                    Отправляем
                  </>
                ) : (
                  'Отправить на проверку'
                )}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CardPaymentDialog;
