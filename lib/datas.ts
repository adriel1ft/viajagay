const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

export function isoDe(ano: number, mes: number, dia: number) {
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

export function partes(iso: string) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return { ano, mes, dia };
}

export function formatarCurto(iso: string) {
  const { dia, mes } = partes(iso);
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
}

export function formatarPeriodo(inicio: string, fim: string) {
  return `${formatarCurto(inicio)} – ${formatarCurto(fim)}`;
}

export function diasDoIntervalo(inicio: string, fim: string) {
  if (!inicio || !fim || fim < inicio) return [];
  const dias: string[] = [];
  const { ano, mes, dia } = partes(inicio);
  const cursor = new Date(ano, mes - 1, dia);
  const limite = partes(fim);
  const fimData = new Date(limite.ano, limite.mes - 1, limite.dia);
  while (cursor <= fimData) {
    dias.push(isoDe(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate()));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}

export function tituloMes(ano: number, mes: number) {
  const nome = MESES[mes - 1];
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} ${ano}`;
}

const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const SEMANA_CURTA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function diaDaSemana(iso: string) {
  const { ano, mes, dia } = partes(iso);
  return new Date(ano, mes - 1, dia).getDay();
}

export function nomeSemana(iso: string) {
  return SEMANA[diaDaSemana(iso)];
}

export function nomeSemanaCurto(iso: string) {
  return SEMANA_CURTA[diaDaSemana(iso)];
}

export function nomeDia(iso: string) {
  const { dia, mes, ano } = partes(iso);
  return `${nomeSemana(iso)}, ${dia} de ${MESES[mes - 1]} de ${ano}`;
}

export function gradeDoMes(ano: number, mes: number) {
  const primeiro = new Date(ano, mes - 1, 1).getDay();
  const total = new Date(ano, mes, 0).getDate();
  const celulas: (number | null)[] = Array(primeiro).fill(null);
  for (let dia = 1; dia <= total; dia += 1) celulas.push(dia);
  while (celulas.length % 7 !== 0) celulas.push(null);
  return celulas;
}

export function mesSeguinte(ano: number, mes: number, direcao: -1 | 1) {
  const data = new Date(ano, mes - 1 + direcao, 1);
  return { ano: data.getFullYear(), mes: data.getMonth() + 1 };
}
