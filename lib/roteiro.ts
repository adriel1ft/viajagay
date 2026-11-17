import lugares from '../data/lugares.json';

export const INTERESSES = [
  'cultura',
  'gastronomia',
  'vida noturna',
  'praia',
  'museus',
  'natureza',
  'lgbtqia+',
];

export type Lugar = {
  id: string;
  nome: string;
  cidade: string;
  categoria: string;
  tags: string[];
  descricao?: string;
  custo?: number;
  melhorHorario?: string;
  latitude: number;
  longitude: number;
};

function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function separarTags(texto: string) {
  return texto.split(',').map(normalizar).filter(Boolean);
}

export function filtrarLugares(destino: string, tags: string[]): Lugar[] {
  const cidade = normalizar(destino);

  return (lugares as Lugar[]).filter(
    (lugar) =>
      normalizar(lugar.cidade) === cidade &&
      (tags.length === 0 || lugar.tags.some((tag) => tags.includes(normalizar(tag)))),
  );
}

export function formatarCusto(custo: number) {
  return custo === 0 ? 'Grátis' : `~R$ ${custo}`;
}
