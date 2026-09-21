import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

type Mode = 'login' | 'register';

interface Props {
  open: boolean;
  onClose: () => void;
  initialMode?: Mode;
}

const AuthDialog = ({ open, onClose, initialMode = 'login' }: Props) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError('');
      setPassword('');
      setBusy(false);
    }
  }, [open, initialMode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const err =
      mode === 'login'
        ? await login({ email, password })
        : await register({ email, nickname, password });
    setBusy(false);

    if (err) {
      setError(err);
      return;
    }

    setError('');
    setPassword('');
    toast({
      title: mode === 'login' ? 'Вы вошли' : 'Аккаунт создан',
      description: 'Баланс и дропы теперь сохраняются в вашем профиле.',
    });
    onClose();
  };

  const field = 'w-full bg-transparent text-[.95em] font-bold outline-none placeholder:text-muted-foreground';
  const box = 'flex items-center gap-2.5 rounded-2xl border border-border bg-background px-4 py-3';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm border-border bg-card">
        <div className="text-center">
          <div className="text-[.68em] font-black uppercase tracking-[.16em] text-primary">
            Nicedrop
          </div>
          <h3 className="mt-1 font-display text-3xl uppercase tracking-[.02em]">
            {mode === 'login' ? 'Вход' : 'Регистрация'}
          </h3>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-2.5">
          <div className={box}>
            <Icon name="Mail" size={17} className="shrink-0 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="E-mail"
              autoComplete="email"
              className={field}
              required
            />
          </div>

          {mode === 'register' && (
            <div className={box}>
              <Icon name="User" size={17} className="shrink-0 text-muted-foreground" />
              <input
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError('');
                }}
                placeholder="Ник в игре"
                autoComplete="username"
                className={field}
                required
              />
            </div>
          )}

          <div className={box}>
            <Icon name="Lock" size={17} className="shrink-0 text-muted-foreground" />
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Пароль"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className={field}
              required
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
            >
              <Icon name={show ? 'EyeOff' : 'Eye'} size={16} />
            </button>
          </div>

          {mode === 'register' && (
            <p className="px-1 text-[.72em] font-bold text-muted-foreground">
              Минимум 8 символов, обязательно буквы и цифры.
            </p>
          )}

          {error && (
            <p className="flex items-center gap-1.5 px-1 text-[.78em] font-bold text-hot">
              <Icon name="TriangleAlert" size={14} />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-display text-[1.05em] tracking-[.03em] text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {busy && <Icon name="LoaderCircle" size={16} className="animate-spin" />}
            {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
          className="mt-3 text-center text-[.8em] font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>

        <p className="mt-1 text-center text-[.7em] font-bold leading-[1.45] text-muted-foreground">
          Пароли хранятся в зашифрованном виде. 18+, играйте ответственно.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
