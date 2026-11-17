import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ComponentProps, ReactNode, useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrincipal, BotaoVoltar } from '../components/botoes';
import { cores, fontes, raio, sombra } from '../constants/tema';
import { atualizarPlano, lerRoteiro } from '../lib/conta';
import { diasDoIntervalo, formatarCurto, nomeDia, nomeSemana, nomeSemanaCurto } from '../lib/datas';
import { distanciaKm, formatarDistancia, linkTransporte, Ponto } from '../lib/local';
import { filtrarLugares, formatarCusto, Lugar, separarTags } from '../lib/roteiro';

type Icone = ComponentProps<typeof Ionicons>['name'];
type Aba = 'disponiveis' | 'meu';
type Plano = Record<string, string>;

const ICONES: Record<string, Icone> = {
  Museu: 'color-palette-outline',
  'Vida noturna': 'musical-notes-outline',
  Bairro: 'storefront-outline',
  Parque: 'leaf-outline',
  Gastronomia: 'restaurant-outline',
  'Arte urbana': 'brush-outline',
};

type Params = {
  id?: string;
  destino: string;
  inicio: string;
  fim: string;
  periodo: string;
  orcamento: string;
  tags: string;
  airbnbLat: string;
  airbnbLng: string;
};

function texto(valor: string | string[] | undefined) {
  return Array.isArray(valor) ? (valor[0] ?? '') : (valor ?? '');
}

export default function Roteiro() {
  const params = useLocalSearchParams<Params>();
  const id = texto(params.id);
  const destino = texto(params.destino);
  const inicio = texto(params.inicio);
  const fim = texto(params.fim);
  const periodo = texto(params.periodo);
  const orcamento = texto(params.orcamento);
  const tags = texto(params.tags);
  const airbnbLat = texto(params.airbnbLat);
  const airbnbLng = texto(params.airbnbLng);
  const lugares = filtrarLugares(destino, separarTags(tags));
  const origem =
    airbnbLat && airbnbLng
      ? { latitude: Number(airbnbLat), longitude: Number(airbnbLng) }
      : null;
  const dias = diasDoIntervalo(inicio, fim);
  const [aba, setAba] = useState<Aba>('disponiveis');
  const [plano, setPlano] = useState<Plano>({});
  const editou = useRef(false);

  useEffect(() => {
    if (!id) return;
    let vivo = true;
    lerRoteiro(id).then((salvo) => {
      if (vivo && salvo && !editou.current) setPlano(salvo.plano);
    });
    return () => {
      vivo = false;
    };
  }, [id]);

  function definir(lugarId: string, dia: string) {
    editou.current = true;
    setPlano((atual) => {
      const proximo = { ...atual, [lugarId]: dia };
      if (id) void atualizarPlano(id, proximo);
      return proximo;
    });
  }

  function tirar(lugarId: string) {
    editou.current = true;
    setPlano((atual) => {
      const proximo = { ...atual };
      delete proximo[lugarId];
      if (id) void atualizarPlano(id, proximo);
      return proximo;
    });
  }

  const meus = Object.keys(plano).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <View style={styles.topo}>
          <BotaoVoltar />
          <Text style={styles.passo}>Passo 3 de 3</Text>
        </View>

        <View style={styles.resumo}>
          <Text style={styles.resumoRotulo}>Seu destino</Text>
          <Text style={styles.resumoCidade} accessibilityRole="header">
            {destino}
          </Text>
          <View style={styles.resumoDados}>
            <Dado icone="calendar-outline" rotulo="Período" valor={periodo} />
            <View style={styles.divisor} />
            <Dado icone="wallet-outline" rotulo="Orçamento" valor={orcamento ? `R$ ${orcamento}` : 'Livre'} />
          </View>
        </View>

        <View style={styles.abas} accessibilityRole="tablist">
          <AbaBotao titulo="Disponíveis" ativa={aba === 'disponiveis'} onPress={() => setAba('disponiveis')} />
          <AbaBotao titulo="Meu roteiro" ativa={aba === 'meu'} onPress={() => setAba('meu')} />
        </View>

        {aba === 'disponiveis' ? (
          <Disponiveis
            lugares={lugares}
            dias={dias}
            plano={plano}
            origem={origem}
            onDefinir={definir}
            onTirar={tirar}
          />
        ) : (
          <MeuRoteiro
            lugares={lugares}
            dias={dias}
            plano={plano}
            origem={origem}
            quantidade={meus}
            onDefinir={definir}
            onTirar={tirar}
          />
        )}
      </ScrollView>

      <View style={styles.rodape}>
        <BotaoPrincipal titulo="Editar preferências" icone="options-outline" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

function AbaBotao({ titulo, ativa, onPress }: { titulo: string; ativa: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: ativa }}
      onPress={onPress}
      style={[styles.aba, ativa && styles.abaAtiva]}
    >
      <Text style={[styles.abaTexto, ativa && styles.abaTextoAtiva]}>{titulo}</Text>
    </Pressable>
  );
}

function Disponiveis({
  lugares,
  dias,
  plano,
  origem,
  onDefinir,
  onTirar,
}: {
  lugares: Lugar[];
  dias: string[];
  plano: Plano;
  origem: Ponto | null;
  onDefinir: (lugarId: string, dia: string) => void;
  onTirar: (lugarId: string) => void;
}) {
  if (lugares.length === 0) {
    return (
      <Vazio
        titulo="Nada por aqui ainda"
        texto="Ainda não temos lugares para esse destino e interesses. Tente outros interesses."
      />
    );
  }

  return (
    <View style={styles.lista}>
      <Text style={styles.contagem}>
        {lugares.length} {lugares.length === 1 ? 'lugar' : 'lugares'}
      </Text>
      {lugares.map((lugar) => (
        <CartaoDisponivel
          key={lugar.id}
          lugar={lugar}
          dias={dias}
          origem={origem}
          diaMarcado={plano[lugar.id]}
          onDefinir={onDefinir}
          onTirar={onTirar}
        />
      ))}
    </View>
  );
}

function CartaoDisponivel({
  lugar,
  dias,
  origem,
  diaMarcado,
  onDefinir,
  onTirar,
}: {
  lugar: Lugar;
  dias: string[];
  origem: Ponto | null;
  diaMarcado?: string;
  onDefinir: (lugarId: string, dia: string) => void;
  onTirar: (lugarId: string) => void;
}) {
  const [dia, setDia] = useState(diaMarcado ?? dias[0] ?? '');
  const noDia = Boolean(dia) && diaMarcado === dia;

  return (
    <CartaoLugar lugar={lugar} origem={origem}>
      {dia ? (
        <>
          <Dias dias={dias} selecionado={dia} onSelect={setDia} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={noDia ? `Tirar ${lugar.nome}` : `Adicionar ${lugar.nome} em ${nomeDia(dia)}`}
            onPress={() => (noDia ? onTirar(lugar.id) : onDefinir(lugar.id, dia))}
            style={[styles.acao, noDia && styles.acaoSecundaria]}
          >
            <Text style={[styles.acaoTexto, noDia && styles.acaoTextoSecundario]}>
              {noDia ? 'Tirar' : diaMarcado ? 'Mover' : 'Adicionar'}
            </Text>
          </Pressable>
        </>
      ) : null}
    </CartaoLugar>
  );
}

function MeuRoteiro({
  lugares,
  dias,
  plano,
  origem,
  quantidade,
  onDefinir,
  onTirar,
}: {
  lugares: Lugar[];
  dias: string[];
  plano: Plano;
  origem: Ponto | null;
  quantidade: number;
  onDefinir: (lugarId: string, dia: string) => void;
  onTirar: (lugarId: string) => void;
}) {
  if (quantidade === 0) {
    return (
      <Vazio
        titulo="Seu roteiro está vazio"
        texto="Abra Disponíveis, escolha um dia e adicione um lugar."
      />
    );
  }

  return (
    <View style={styles.lista}>
      {dias.map((dia) => {
        const doDia = lugares.filter((lugar) => plano[lugar.id] === dia);
        const semana = nomeSemana(dia);
        return (
          <View key={dia} style={styles.grupo}>
            <Text style={styles.diaTitulo}>
              {semana.charAt(0).toUpperCase()}
              {semana.slice(1)}, {formatarCurto(dia)}
            </Text>
            {doDia.length === 0 ? (
              <Text style={styles.diaVazio}>Nada neste dia</Text>
            ) : (
              doDia.map((lugar) => (
                <CartaoLugar key={lugar.id} lugar={lugar} origem={origem}>
                  <Dias dias={dias} selecionado={dia} onSelect={(novo) => onDefinir(lugar.id, novo)} />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Tirar ${lugar.nome}`}
                    onPress={() => onTirar(lugar.id)}
                    style={[styles.acao, styles.acaoSecundaria]}
                  >
                    <Text style={[styles.acaoTexto, styles.acaoTextoSecundario]}>Tirar</Text>
                  </Pressable>
                </CartaoLugar>
              ))
            )}
          </View>
        );
      })}
    </View>
  );
}

function Dias({
  dias,
  selecionado,
  onSelect,
}: {
  dias: string[];
  selecionado: string;
  onSelect: (dia: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dias}>
      {dias.map((dia) => {
        const ativo = dia === selecionado;
        return (
          <Pressable
            key={dia}
            accessibilityRole="button"
            accessibilityLabel={nomeDia(dia)}
            accessibilityState={{ selected: ativo }}
            onPress={() => onSelect(dia)}
            style={[styles.diaChip, ativo && styles.diaChipAtivo]}
          >
            <Text style={[styles.diaChipSemana, ativo && styles.diaChipTextoAtivo]}>{nomeSemanaCurto(dia)}</Text>
            <Text style={[styles.diaChipTexto, ativo && styles.diaChipTextoAtivo]}>{formatarCurto(dia)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function Vazio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <View style={styles.vazio}>
      <Ionicons name="compass-outline" size={40} color={cores.suave} />
      <Text style={styles.vazioTitulo}>{titulo}</Text>
      <Text style={styles.vazioTexto}>{texto}</Text>
    </View>
  );
}

function Dado({ icone, rotulo, valor }: { icone: Icone; rotulo: string; valor: string }) {
  return (
    <View style={styles.dado}>
      <Ionicons name={icone} size={18} color="rgba(255,255,255,0.7)" />
      <View>
        <Text style={styles.dadoRotulo}>{rotulo}</Text>
        <Text style={styles.dadoValor}>{valor}</Text>
      </View>
    </View>
  );
}

function CartaoLugar({
  lugar,
  origem,
  children,
}: {
  lugar: Lugar;
  origem?: Ponto | null;
  children?: ReactNode;
}) {
  const distancia = origem
    ? `${formatarDistancia(distanciaKm(origem, lugar))} do Airbnb`
    : null;

  function abrirTrajeto() {
    if (!origem) return;
    const url = linkTransporte(origem, lugar, Platform.OS);
    if (Platform.OS === 'web') {
      const aba = window.open(url, '_blank', 'noopener,noreferrer');
      if (!aba) Linking.openURL(url);
      return;
    }
    Linking.openURL(url);
  }

  const corpo = (
    <>
      <View style={styles.cartaoTopo}>
        <View style={styles.cartaoIcone}>
          <Ionicons name={ICONES[lugar.categoria] ?? 'location-outline'} size={22} color={cores.destaque} />
        </View>
        <View style={styles.cartaoTitulos}>
          <Text style={styles.cartaoNome}>{lugar.nome}</Text>
          <Text style={styles.cartaoCategoria}>{lugar.categoria}</Text>
        </View>
      </View>

      {lugar.descricao ? <Text style={styles.cartaoDescricao}>{lugar.descricao}</Text> : null}

      <View style={styles.cartaoMeta}>
        {lugar.custo !== undefined ? (
          <View style={styles.meta}>
            <Ionicons name="cash-outline" size={16} color={cores.suave} />
            <Text style={styles.metaTexto}>{formatarCusto(lugar.custo)}</Text>
          </View>
        ) : null}
        {lugar.melhorHorario ? (
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={16} color={cores.suave} />
            <Text style={styles.metaTexto}>{lugar.melhorHorario}</Text>
          </View>
        ) : null}
        {distancia ? (
          <View style={styles.meta}>
            <Ionicons name="navigate-outline" size={16} color={cores.suave} />
            <Text style={styles.metaTexto}>{distancia}</Text>
          </View>
        ) : null}
      </View>
      {origem ? <Text style={styles.trajeto}>Ver trajeto de transporte</Text> : null}
    </>
  );

  return (
    <View style={styles.cartao}>
      {origem ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Ver trajeto de transporte até ${lugar.nome}`}
          onPress={abrirTrajeto}
          style={({ pressed }) => (pressed ? styles.pressionado : undefined)}
        >
          {corpo}
        </Pressable>
      ) : (
        corpo
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { paddingHorizontal: 24, paddingBottom: 24 },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 20,
  },
  passo: { fontFamily: fontes.semi, fontSize: 14, color: cores.suave },
  resumo: { ...sombra, backgroundColor: cores.tinta, borderRadius: raio.g, padding: 24 },
  resumoRotulo: { fontFamily: fontes.media, fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  resumoCidade: {
    fontFamily: fontes.extra,
    fontSize: 32,
    lineHeight: 38,
    color: cores.sobreDestaque,
    marginTop: 4,
  },
  resumoDados: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  divisor: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 16 },
  dado: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dadoRotulo: { fontFamily: fontes.media, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  dadoValor: { fontFamily: fontes.negrito, fontSize: 16, color: cores.sobreDestaque },
  abas: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 20,
    padding: 4,
    borderRadius: raio.pilula,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  aba: { flex: 1, minHeight: 40, borderRadius: raio.pilula, alignItems: 'center', justifyContent: 'center' },
  abaAtiva: { backgroundColor: cores.tinta },
  abaTexto: { fontFamily: fontes.semi, fontSize: 14, color: cores.texto },
  abaTextoAtiva: { color: cores.sobreDestaque },
  lista: { marginTop: 18, gap: 14 },
  contagem: { fontFamily: fontes.semi, fontSize: 14, color: cores.suave },
  grupo: { gap: 10 },
  diaTitulo: { fontFamily: fontes.negrito, fontSize: 18, color: cores.tinta, marginTop: 8 },
  diaVazio: { fontFamily: fontes.regular, fontSize: 14, color: cores.suave },
  dias: { gap: 8, paddingVertical: 2 },
  diaChip: {
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: raio.p,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.fundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaChipAtivo: { backgroundColor: cores.tinta, borderColor: cores.tinta },
  diaChipSemana: { fontFamily: fontes.semi, fontSize: 11, color: cores.suave, textTransform: 'uppercase' },
  diaChipTexto: { fontFamily: fontes.semi, fontSize: 13, color: cores.texto },
  diaChipTextoAtivo: { color: cores.sobreDestaque },
  acao: {
    minHeight: 40,
    borderRadius: raio.p,
    backgroundColor: cores.destaque,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acaoSecundaria: { backgroundColor: cores.fundo },
  acaoTexto: { fontFamily: fontes.negrito, fontSize: 14, color: cores.sobreDestaque },
  acaoTextoSecundario: { color: cores.tinta },
  cartao: { ...sombra, backgroundColor: cores.superficie, borderRadius: raio.g, padding: 18, gap: 12 },
  pressionado: { opacity: 0.85 },
  trajeto: { fontFamily: fontes.semi, fontSize: 14, color: cores.destaque },
  cartaoTopo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cartaoIcone: {
    width: 48,
    height: 48,
    borderRadius: raio.m,
    backgroundColor: cores.destaqueSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartaoTitulos: { flex: 1, gap: 2 },
  cartaoNome: { fontFamily: fontes.negrito, fontSize: 17, color: cores.tinta },
  cartaoCategoria: { fontFamily: fontes.semi, fontSize: 13, color: cores.destaque },
  cartaoDescricao: { fontFamily: fontes.regular, fontSize: 15, lineHeight: 22, color: cores.texto },
  cartaoMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: raio.pilula,
    backgroundColor: cores.fundo,
  },
  metaTexto: { fontFamily: fontes.semi, fontSize: 13, color: cores.texto },
  vazio: { alignItems: 'center', gap: 8, paddingVertical: 40, paddingHorizontal: 16 },
  vazioTitulo: { fontFamily: fontes.negrito, fontSize: 18, color: cores.tinta },
  vazioTexto: {
    fontFamily: fontes.regular,
    fontSize: 15,
    lineHeight: 22,
    color: cores.suave,
    textAlign: 'center',
  },
  rodape: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16, backgroundColor: cores.fundo },
});
