import type { Tag } from '../types/models';

/** Paleta de categorias: matizes bem espaçados, todos claros o bastante pra texto escuro por cima. */
export const PALETA_TAGS = [
  '#e57373', // vermelho
  '#f0a35e', // laranja
  '#e6c34f', // amarelo
  '#a6c95a', // lima
  '#5fc48a', // verde
  '#4fbfc0', // turquesa
  '#5aa5e6', // azul
  '#b18be0', // roxo
  '#e68bb5', // rosa
  '#c9a27e', // areia
];

/** Cor neutra pra gasto sem nenhuma categoria. */
export const COR_SEM_TAG = 'var(--muted-fill)';

function hash(texto: string): number {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Tags antigas não têm cor gravada. Em vez de escrever no banco, cada uma
 * ganha uma cor determinística (hash do id), evitando as já usadas por outra
 * tag. A ordem é por id, então não muda quando surgem tags novas (que sempre
 * nascem com cor gravada).
 */
export function comCoresResolvidas(tags: Tag[]): Tag[] {
  const usadas = new Set(tags.filter((t) => t.cor).map((t) => t.cor));
  const resolvidas = new Map<string, string>();

  [...tags]
    .filter((t) => !t.cor)
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .forEach((t) => {
      const inicio = hash(t.id) % PALETA_TAGS.length;
      let cor = PALETA_TAGS[inicio];
      for (let i = 0; i < PALETA_TAGS.length; i++) {
        const candidata = PALETA_TAGS[(inicio + i) % PALETA_TAGS.length];
        if (!usadas.has(candidata)) {
          cor = candidata;
          break;
        }
      }
      usadas.add(cor);
      resolvidas.set(t.id, cor);
    });

  return tags.map((t) => (t.cor ? t : { ...t, cor: resolvidas.get(t.id)! }));
}

/** Primeira cor da paleta que nenhuma tag usa ainda (ou a próxima da fila, se todas já estiverem em uso). */
export function proximaCorLivre(tags: Tag[]): string {
  const usadas = new Set(tags.map((t) => t.cor));
  return PALETA_TAGS.find((c) => !usadas.has(c)) ?? PALETA_TAGS[tags.length % PALETA_TAGS.length];
}
