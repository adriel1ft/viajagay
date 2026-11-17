import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE = 'viajagay/conta';

export type Usuario = {
  nome: string;
  telefone: string;
};

export type RoteiroSalvo = {
  id: string;
  destino: string;
  inicio: string;
  fim: string;
  periodo: string;
  orcamento: string;
  tags: string;
  airbnbLat: string;
  airbnbLng: string;
  plano: Record<string, string>;
};

type Arquivo = {
  sessao: Usuario | null;
  porTelefone: Record<string, { nome: string; roteiros: RoteiroSalvo[] }>;
};

const vazio: Arquivo = { sessao: null, porTelefone: {} };

export function digitosTelefone(telefone: string) {
  return telefone.replace(/\D/g, '');
}

export function telefoneValido(telefone: string) {
  const digitos = digitosTelefone(telefone);
  return digitos.length === 10 || digitos.length === 11;
}

function novoId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function ler(): Promise<Arquivo> {
  const texto = await AsyncStorage.getItem(CHAVE);
  if (!texto) return vazio;
  try {
    const dados = JSON.parse(texto) as Partial<Arquivo>;
    return {
      sessao: dados.sessao ?? null,
      porTelefone: dados.porTelefone ?? {},
    };
  } catch {
    return vazio;
  }
}

async function gravar(arquivo: Arquivo) {
  await AsyncStorage.setItem(CHAVE, JSON.stringify(arquivo));
}

let fila = Promise.resolve();

function emFila<T>(trabalho: () => Promise<T>) {
  const execucao = fila.then(trabalho, trabalho);
  fila = execucao.then(
    () => undefined,
    () => undefined,
  );
  return execucao;
}

export async function lerSessao() {
  const arquivo = await ler();
  return arquivo.sessao;
}

export function entrar(nome: string, telefone: string) {
  return emFila(async () => {
    const arquivo = await ler();
    const usuario = { nome: nome.trim(), telefone: digitosTelefone(telefone) };
    const atual = arquivo.porTelefone[usuario.telefone] ?? { nome: usuario.nome, roteiros: [] };
    arquivo.porTelefone[usuario.telefone] = { ...atual, nome: usuario.nome };
    arquivo.sessao = usuario;
    await gravar(arquivo);
    return usuario;
  });
}

export function sair() {
  return emFila(async () => {
    const arquivo = await ler();
    arquivo.sessao = null;
    await gravar(arquivo);
  });
}

export function listarRoteiros() {
  return emFila(async () => {
    const arquivo = await ler();
    if (!arquivo.sessao) return [];
    return arquivo.porTelefone[arquivo.sessao.telefone]?.roteiros ?? [];
  });
}

export async function criarRoteiro(dados: Omit<RoteiroSalvo, 'id' | 'plano'>) {
  const roteiro: RoteiroSalvo = { ...dados, id: novoId(), plano: {} };
  await salvarRoteiro(roteiro);
  return roteiro;
}

export function salvarRoteiro(roteiro: RoteiroSalvo) {
  return emFila(async () => {
    const arquivo = await ler();
    if (!arquivo.sessao) return;
    const chave = arquivo.sessao.telefone;
    const atual = arquivo.porTelefone[chave] ?? { nome: arquivo.sessao.nome, roteiros: [] };
    const resto = atual.roteiros.filter((item) => item.id !== roteiro.id);
    arquivo.porTelefone[chave] = { nome: arquivo.sessao.nome, roteiros: [roteiro, ...resto] };
    await gravar(arquivo);
  });
}

export function atualizarPlano(id: string, plano: Record<string, string>) {
  return emFila(async () => {
    const arquivo = await ler();
    if (!arquivo.sessao) return;
    const chave = arquivo.sessao.telefone;
    const atual = arquivo.porTelefone[chave];
    if (!atual) return;
    arquivo.porTelefone[chave] = {
      ...atual,
      roteiros: atual.roteiros.map((item) => (item.id === id ? { ...item, plano } : item)),
    };
    await gravar(arquivo);
  });
}

export async function lerRoteiro(id: string) {
  const roteiros = await listarRoteiros();
  return roteiros.find((item) => item.id === id) ?? null;
}
