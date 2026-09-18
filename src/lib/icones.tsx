/** Ícones padrão de perfil — sem upload, só uma escolha entre um conjunto fixo de animais. */
export const ICONES: Record<string, JSX.Element> = {
  gato: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="6 9 8 3 11 8" />
      <polygon points="18 9 16 3 13 8" />
      <circle cx="12" cy="14" r="7" />
      <circle cx="9.5" cy="13" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="13" r="0.6" fill="currentColor" stroke="none" />
      <path d="M10.5 16c1 .8 2 .8 3 0" />
    </svg>
  ),
  cachorro: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="4.8" cy="13.5" rx="2.1" ry="4.3" transform="rotate(-18 4.8 13.5)" />
      <ellipse cx="19.2" cy="13.5" rx="2.1" ry="4.3" transform="rotate(18 19.2 13.5)" />
      <circle cx="12" cy="13" r="6" />
      <circle cx="9.5" cy="12" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="15.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  coelho: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="9" cy="6" rx="1.5" ry="5" />
      <ellipse cx="15" cy="6" rx="1.5" ry="5" />
      <circle cx="12" cy="15" r="6" />
      <circle cx="10" cy="14" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14" cy="14" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  urso: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="6" r="2" />
      <circle cx="17" cy="6" r="2" />
      <circle cx="12" cy="14" r="8" />
      <circle cx="9.5" cy="13" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="13" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  raposa: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="6 8 8 2 12 7" />
      <polygon points="18 8 16 2 12 7" />
      <circle cx="12" cy="13" r="6" />
      <polygon points="10 17.5 14 17.5 12 20.5" />
      <circle cx="9.5" cy="12" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  coruja: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="6 4 8.5 8.5 4 8" />
      <polygon points="18 4 15.5 8.5 20 8" />
      <circle cx="9" cy="12.5" r="3.5" />
      <circle cx="15" cy="12.5" r="3.5" />
      <circle cx="9" cy="12.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12.5" r="1" fill="currentColor" stroke="none" />
      <polygon points="11 15.5 13 15.5 12 18" />
    </svg>
  ),
  peixe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="10" cy="12" rx="7" ry="4" />
      <polygon points="17 8 22 12 17 16" />
      <circle cx="6" cy="11" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  passarinho: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="13" r="6" />
      <polygon points="16 12 21 13 16 14" />
      <circle cx="8" cy="11" r="0.6" fill="currentColor" stroke="none" />
      <path d="M7 19c-2 0-3 1-3 2" />
    </svg>
  ),
};

export const IDS_ICONES = Object.keys(ICONES);
