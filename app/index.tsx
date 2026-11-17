import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrincipal } from '../components/botoes';
import { cores, fontes, raio, sombra } from '../constants/tema';
import { listarRoteiros, lerSessao, RoteiroSalvo, sair, Usuario } from '../lib/conta';

export default function BoasVindas() {
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [roteiros, setRoteiros] = useState<RoteiroSalvo[]>([]);

  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      lerSessao().then(async (sessao) => {
        const lista = sessao ? await listarRoteiros() : [];
        if (!vivo) return;
        setUsuario(sessao);
        setRoteiros(lista);
        setCarregando(false);
      });
      return () => {
        vivo = false;
      };
    }, []),
  );

  async function encerrar() {
    await sair();
    setUsuario(null);
    setRoteiros([]);
  }

  if (carregando) return <SafeAreaView style={styles.container} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.marca}>
        <View style={styles.logo}>
          <Ionicons name="paper-plane" size={16} color={cores.sobreDestaque} />
        </View>
        <Text style={styles.marcaTexto}>ViajaGay</Text>
        {usuario ? (
          <Pressable accessibilityRole="button" onPress={encerrar} hitSlop={8} style={styles.sair}>
            <Text style={styles.sairTexto}>Sair</Text>
          </Pressable>
        ) : null}
      </View>

      <LinearGradient
        colors={['#F2B48F', '#C9573A', '#5B2A22']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, usuario && styles.heroCurto]}
        accessible={false}
      >
        <View style={[styles.circulo, styles.circuloGrande]} />
        <View style={[styles.circulo, styles.circuloPequeno]} />
        <Ionicons name="airplane" size={56} color="rgba(255,255,255,0.92)" style={styles.aviao} />
      </LinearGradient>

      <View style={styles.textos}>
        <Text style={styles.titulo} accessibilityRole="header">
          {usuario ? `Olá, ${usuario.nome}` : 'Bem-vindo ao ViajaGay'}
        </Text>
        <Text style={styles.subtitulo}>
          {usuario
            ? 'Seus roteiros ficam salvos neste aparelho.'
            : 'Monte roteiros personalizados para sua próxima viagem'}
        </Text>
      </View>

      {usuario ? (
        <ScrollView style={styles.lista} contentContainerStyle={styles.listaConteudo}>
          {roteiros.length === 0 ? (
            <Text style={styles.vazio}>Nenhum roteiro ainda.</Text>
          ) : (
            roteiros.map((item) => {
              const paradas = Object.keys(item.plano).length;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/roteiro',
                      params: {
                        id: item.id,
                        destino: item.destino,
                        inicio: item.inicio,
                        fim: item.fim,
                        periodo: item.periodo,
                        orcamento: item.orcamento,
                        tags: item.tags,
                        airbnbLat: item.airbnbLat,
                        airbnbLng: item.airbnbLng,
                      },
                    })
                  }
                  style={({ pressed }) => [styles.cartao, pressed && styles.pressionado]}
                >
                  <Text style={styles.cartaoCidade}>{item.destino}</Text>
                  <Text style={styles.cartaoPeriodo}>{item.periodo}</Text>
                  <Text style={styles.cartaoParadas}>
                    {paradas === 0 ? 'Nenhuma parada ainda' : paradas === 1 ? '1 parada' : `${paradas} paradas`}
                  </Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      ) : null}

      <BotaoPrincipal
        titulo={usuario ? 'Novo roteiro' : 'Embarcar'}
        onPress={() => router.push(usuario ? '/planejar' : '/entrar')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingBottom: 16, backgroundColor: cores.fundo },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  logo: {
    width: 32,
    height: 32,
    borderRadius: raio.p,
    backgroundColor: cores.destaque,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaTexto: { flex: 1, fontFamily: fontes.extra, fontSize: 18, color: cores.tinta },
  sair: { minHeight: 44, justifyContent: 'center' },
  sairTexto: { fontFamily: fontes.semi, fontSize: 15, color: cores.destaque },
  hero: {
    flex: 1,
    marginTop: 20,
    borderRadius: raio.g,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroCurto: { flex: 0, height: 140 },
  circulo: { position: 'absolute', borderRadius: raio.pilula, borderColor: 'rgba(255,255,255,0.25)' },
  circuloGrande: { width: 320, height: 320, borderWidth: 1, top: -80, right: -120 },
  circuloPequeno: { width: 180, height: 180, borderWidth: 1, top: 10, right: -40 },
  aviao: { position: 'absolute', top: 56, right: 44, transform: [{ rotate: '-20deg' }] },
  textos: { marginTop: 28, marginBottom: 20, gap: 10 },
  titulo: { fontFamily: fontes.extra, fontSize: 34, lineHeight: 40, color: cores.tinta },
  subtitulo: { fontFamily: fontes.regular, fontSize: 17, lineHeight: 25, color: cores.suave },
  lista: { flex: 1, marginBottom: 16 },
  listaConteudo: { gap: 12 },
  vazio: { fontFamily: fontes.media, fontSize: 16, color: cores.suave },
  cartao: {
    ...sombra,
    backgroundColor: cores.superficie,
    borderRadius: raio.m,
    padding: 16,
    gap: 4,
  },
  pressionado: { opacity: 0.85 },
  cartaoCidade: { fontFamily: fontes.negrito, fontSize: 18, color: cores.tinta },
  cartaoPeriodo: { fontFamily: fontes.media, fontSize: 14, color: cores.texto },
  cartaoParadas: { fontFamily: fontes.media, fontSize: 14, color: cores.suave },
});
