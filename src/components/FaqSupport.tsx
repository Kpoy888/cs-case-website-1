import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { faq } from '@/data/nicedrop';

const FaqSupport = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ email?: string; message?: string }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) next.email = 'Укажите корректный e-mail';
    if (message.trim().length < 10) next.message = 'Опишите вопрос подробнее (от 10 символов)';
    setErrors(next);
    if (Object.keys(next).length) return;
    setEmail('');
    setMessage('');
    toast({
      title: 'Обращение отправлено',
      description: 'Поддержка ответит на вашу почту в течение 15 минут.',
    });
  };

  return (
    <section id="faq" className="scroll-mt-24">
      <div className="mb-4">
        <h2 className="font-display text-3xl uppercase tracking-[.02em] sm:text-4xl">
          FAQ и <span className="text-primary">поддержка</span>
        </h2>
        <p className="mt-2 text-[.85em] font-bold text-muted-foreground">
          Ответы на частые вопросы — и живой чат, если ответа не нашлось.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="rounded-[var(--hero-radius)] border border-border bg-card px-5 py-1">
          <Accordion type="single" collapsible>
            {faq.map((f, i) => (
              <AccordionItem key={f.q} value={`i${i}`} className="border-border">
                <AccordionTrigger className="text-left text-[.92em] font-extrabold hover:text-primary hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-[.85em] font-bold leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <form
          onSubmit={submit}
          className="flex flex-col rounded-[var(--hero-radius)] border border-border bg-card p-5"
        >
          <div className="font-display text-[.82em] uppercase tracking-[.2em] text-muted-foreground">
            Написать в поддержку
          </div>

          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((p) => ({ ...p, email: undefined }));
            }}
            type="email"
            placeholder="E-mail для ответа"
            className="mt-4 rounded-xl border border-border bg-background px-4 py-3 text-[.9em] font-bold outline-none transition-colors focus:border-primary placeholder:text-muted-foreground"
            aria-label="E-mail"
          />
          {errors.email && (
            <p className="mt-1.5 text-[.75em] font-bold text-hot">{errors.email}</p>
          )}

          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setErrors((p) => ({ ...p, message: undefined }));
            }}
            rows={5}
            placeholder="Опишите вопрос: номер заказа, ник, что пошло не так"
            className="mt-3 resize-none rounded-xl border border-border bg-background px-4 py-3 text-[.9em] font-bold outline-none transition-colors focus:border-primary placeholder:text-muted-foreground"
            aria-label="Сообщение"
          />
          {errors.message && (
            <p className="mt-1.5 text-[.75em] font-bold text-hot">{errors.message}</p>
          )}

          <button
            type="submit"
            className="mt-4 rounded-full bg-primary py-3 font-display text-[1.05em] tracking-[.03em] text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Отправить
          </button>

          <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-[.78em] font-bold text-muted-foreground">
            <Icon name="Send" size={15} className="text-primary" />
            Telegram-поддержка: @nicedrop_help
          </div>
        </form>
      </div>
    </section>
  );
};

export default FaqSupport;
