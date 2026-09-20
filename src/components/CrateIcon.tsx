interface CrateIconProps {
  className?: string;
}

/** Ящик-кейс из выбранного экрана. Цвет берётся из CSS-переменной --c. */
const CrateIcon = ({ className }: CrateIconProps) => (
  <svg viewBox="0 0 120 96" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 34h96v50a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V34Z"
      fill="hsl(var(--crate))"
    />
    <path d="M12 34 24 16h72l12 18H12Z" fill="hsl(var(--crate-top))" />
    <path d="M52 34h16v56H52z" fill="hsl(var(--c, var(--glow)) / 0.7)" />
    <path d="M52 16h16v18H52z" fill="hsl(var(--c, var(--glow)) / 0.45)" />
    <rect x="54" y="52" width="12" height="14" rx="3" fill="hsl(var(--c, var(--glow)))" />
    <path d="M12 34h96" stroke="rgba(0,0,0,.45)" strokeWidth="2" />
  </svg>
);

export default CrateIcon;
