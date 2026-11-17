import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrincipal, BotaoVoltar } from '../components/botoes';
import { Calendario } from '../components/calendario';
import { cores, fontes, raio, sombra } from '../constants/tema';
import { criarRoteiro, lerSessao } from '../lib/conta';
import { formatarCurto, formatarPeriodo } from '../lib/datas';
import { geocodificar } from '../lib/local';
import { INTERESSES } from '../lib/roteiro';

export default function Planejar() {
  const [destino, setDestino] = useState('São Paulo');
  const [inicio, setInicio] = useState<string | null>(null);
  const [fim, setFim] = useState<string | null>(null);
  const [orcamento, setOrcamento] = useState('');
  const [airbnb, setAirbnb] = useState('');
  const [erroAirbnb, setErroAirbnb] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  function alternarTag(tag: string) {
    setTags(tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]);
  }

  async function gerarRoteiro() {
    const endereco = airbnb.trim();
    let latitude = '';
    let longitude = '';

    if (endereco) {
      setBuscando(true);
      setErroAirbnb('');
      try {
        const ponto = await geocodificar(endereco, destino.trim());
        if (!ponto) {
          setErroAirbnb('Não encontrei esse endereço. Inclua a rua e o número.');
          return;
        }
        latitude = String(ponto.latitude);
        longitude = String(ponto.longitude);
      } catch {
        setErroAirbnb('Não consegui localizar o endereço agora.');
        return;
      } finally {
        setBuscando(false);
      }
    }

    const sessao = await lerSessao();
    if (!sessao) {
      router.push('/entrar');
      return;
    }

    const roteiro = await criarRoteiro({
      destino: destino.trim(),
      inicio: inicio!,
      fim: fim!,
      periodo: formatarPeriodo(inicio!, fim!),
      orcamento,
      tags: tags.join(','),
      airbnbLat: latitude,
      airbnbLng: longitude,
    });

    router.push({
      pathname: '/roteiro',
      params: {
        id: roteiro.id,
        destino: roteiro.destino,
        inicio: roteiro.inicio,
        fim: roteiro.fim,
        periodo: roteiro.periodo,
        orcamento: roteiro.orcamento,
        tags: roteiro.tags,
        airbnbLat: roteiro.airbnbLat,
        airbnbLng: roteiro.airbnbLng,
      },
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topo}>
        <BotaoVoltar />
        <Text style={styles.passo}>Passo 2 de 3</Text>
      </View>
      <View
        style={styles.progresso}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: 3, now: 2 }}
      >
        {[1, 2, 3].map((n) => (
          <View key={n} style={[styles.segmento, n <= 2 && styles.segmentoAtivo]} />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.titulo} accessibilityRole="header">
          Planeje sua viagem
        </Text>
        <Text style={styles.subtitulo}>Conte o que você procura e a gente monta o resto.</Text>

        <View style={styles.cartao}>
          <Text style={styles.rotulo}>Destino</Text>
          <View style={styles.campo}>
            <Ionicons name="location-outline" size={20} color={cores.suave} />
            <TextInput
              style={styles.input}
              placeholder="Para onde você vai?"
              placeholderTextColor={cores.suave}
              value={destino}
              onChangeText={setDestino}
              accessibilityLabel="Destino"
            />
          </View>

          <Text style={styles.rotulo}>Datas</Text>
          <Text style={styles.periodo}>
            {inicio && fim
              ? formatarPeriodo(inicio, fim)
              : inicio
                ? `${formatarCurto(inicio)} – escolha a volta`
                : 'Toque a ida e depois a volta'}
          </Text>
          <Calendario
            inicio={inicio}
            fim={fim}
            onChange={(novaIda, novaVolta) => {
              setInicio(novaIda);
              setFim(novaVolta);
            }}
          />

          <Text style={styles.rotulo}>Airbnb</Text>
          <View style={styles.campo}>
            <Ionicons name="home-outline" size={20} color={cores.suave} />
            <TextInput
              style={styles.input}
              placeholder="Rua e número"
              placeholderTextColor={cores.suave}
              value={airbnb}
              onChangeText={(texto) => {
                setAirbnb(texto);
                setErroAirbnb('');
              }}
              accessibilityLabel="Endereço do Airbnb"
            />
          </View>
          {erroAirbnb ? <Text style={styles.erro}>{erroAirbnb}</Text> : null}

          <Text style={styles.rotulo}>Orçamento</Text>
          <View style={styles.campo}>
            <Text style={styles.prefixo}>R$</Text>
            <TextInput
              style={styles.input}
              placeholder="1.500"
              placeholderTextColor={cores.suave}
              keyboardType="numeric"
              value={orcamento}
              onChangeText={setOrcamento}
              accessibilityLabel="Orçamento em reais"
            />
          </View>
        </View>

        <Text style={styles.secao}>Interesses</Text>
        <View style={styles.chips}>
          {INTERESSES.map((tag) => {
            const selecionada = tags.includes(tag);
            return (
              <Pressable
                key={tag}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selecionada }}
                onPress={() => alternarTag(tag)}
                style={[styles.chip, selecionada && styles.chipSelecionada]}
              >
                {selecionada ? (
                  <Ionicons name="checkmark" size={16} color={cores.sobreDestaque} />
                ) : null}
                <Text style={[styles.chipTexto, selecionada && styles.chipTextoSelecionado]}>
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.rodape}>
        <BotaoPrincipal
          titulo={buscando ? 'Buscando endereço...' : 'Gerar roteiro'}
          desativado={!destino.trim() || !inicio || !fim || buscando}
          onPress={gerarRoteiro}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  passo: { fontFamily: fontes.semi, fontSize: 14, color: cores.suave },
  progresso: { flexDirection: 'row', gap: 6, paddingHorizontal: 24, marginTop: 16 },
  segmento: { flex: 1, height: 4, borderRadius: raio.pilula, backgroundColor: cores.borda },
  segmentoAtivo: { backgroundColor: cores.destaque },
  conteudo: { padding: 24, paddingBottom: 32 },
  titulo: { fontFamily: fontes.extra, fontSize: 32, lineHeight: 38, color: cores.tinta },
  subtitulo: {
    fontFamily: fontes.regular,
    fontSize: 16,
    lineHeight: 23,
    color: cores.suave,
    marginTop: 8,
    marginBottom: 24,
  },
  cartao: {
    ...sombra,
    backgroundColor: cores.superficie,
    borderRadius: raio.g,
    padding: 20,
    gap: 10,
  },
  rotulo: { fontFamily: fontes.semi, fontSize: 14, color: cores.texto, marginTop: 6 },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: raio.m,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.fundo,
  },
  input: { flex: 1, fontFamily: fontes.media, fontSize: 16, color: cores.tinta, paddingVertical: 14 },
  prefixo: { fontFamily: fontes.semi, fontSize: 16, color: cores.suave },
  periodo: { fontFamily: fontes.media, fontSize: 15, color: cores.suave, marginBottom: 4 },
  erro: { fontFamily: fontes.media, fontSize: 14, color: cores.destaque },
  secao: { fontFamily: fontes.negrito, fontSize: 18, color: cores.tinta, marginTop: 28, marginBottom: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: raio.pilula,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
  },
  chipSelecionada: { backgroundColor: cores.tinta, borderColor: cores.tinta },
  chipTexto: { fontFamily: fontes.semi, fontSize: 15, color: cores.texto },
  chipTextoSelecionado: { color: cores.sobreDestaque },
  rodape: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
});
