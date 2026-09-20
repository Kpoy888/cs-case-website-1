import Icon from '@/components/ui/icon';
import { navLinks } from '@/data/nicedrop';

const Footer = () => (
  <footer className="mt-4 rounded-[var(--hero-radius)] border border-border bg-card p-6">
    <div className="flex flex-wrap items-start gap-8">
      <div className="min-w-[220px]">
        <div className="font-display text-[1.55em] leading-none tracking-[.02em]">
          NICE<span className="text-primary">DROP</span>
        </div>
        <p className="mt-3 max-w-xs text-[.78em] font-bold leading-[1.5] text-muted-foreground">
          Открытие кейсов CS2 с проверяемым дропом. Сервис не связан с Valve Corporation.
        </p>
      </div>

      <div>
        <div className="mb-3 font-display text-[.78em] uppercase tracking-[.2em] text-muted-foreground">
          Разделы
        </div>
        <ul className="space-y-2">
          {navLinks.map((l) => (
            <li key={l.id}>
              <button
                onClick={() =>
                  document.getElementById(l.id)?.scrollIntoView({ behavior: 'smooth' })
                }
                className="text-[.82em] font-bold text-muted-foreground transition-colors hover:text-primary"
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="mb-3 font-display text-[.78em] uppercase tracking-[.2em] text-muted-foreground">
          Контакты
        </div>
        <ul className="space-y-2 text-[.82em] font-bold text-muted-foreground">
          <li className="flex items-center gap-2">
            <Icon name="Send" size={14} className="text-primary" />
            @nicedrop_help
          </li>
          <li className="flex items-center gap-2">
            <Icon name="Mail" size={14} className="text-primary" />
            support@nicedrop.gg
          </li>
          <li className="flex items-center gap-2">
            <Icon name="Clock" size={14} className="text-primary" />
            Поддержка 24/7
          </li>
        </ul>
      </div>

      <div className="ml-auto rounded-2xl border border-border bg-background p-4">
        <div className="flex items-center gap-2 text-[.8em] font-extrabold">
          <Icon name="ShieldCheck" size={16} className="text-primary" />
          18+ Играйте ответственно
        </div>
        <p className="mt-2 max-w-[240px] text-[.72em] font-bold leading-[1.5] text-muted-foreground">
          Открытие кейсов — развлечение, а не способ заработка. Устанавливайте лимиты.
        </p>
      </div>
    </div>

    <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-4 text-[.72em] font-bold text-muted-foreground">
      <span>© {new Date().getFullYear()} Nicedrop</span>
      <span>Пользовательское соглашение</span>
      <span>Политика конфиденциальности</span>
    </div>
  </footer>
);

export default Footer;
