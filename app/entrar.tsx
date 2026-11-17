import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrincipal, BotaoVoltar } from '../components/botoes';
import { cores, fontes, raio, sombra } from '../constants/tema';
import { entrar, telefoneValido } from '../lib/conta';

export default function Entrar() {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function confirmar() {
    if (nome.trim().length < 2 || !telefoneValido(telefone)) {
      setErro('Use seu nome e um telefone com DDD.');
      return;
    }
    setEnviando(true);
    setErro('');
    await entrar(nome, telefone);
    router.replace('/planejar');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topo}>
        <BotaoVoltar />
      </View>
      <View style={styles.conteudo}>
        <Text style={styles.titulo} accessibilityRole="header">
          Quem viaja
        </Text>
        <Text style={styles.subtitulo}>Seu nome e telefone guardam os roteiros neste aparelho.</Text>

        <View style={styles.cartao}>
          <Text style={styles.rotulo}>Nome</Text>
          <View style={styles.campo}>
            <Ionicons name="person-outline" size={20} color={cores.suave} />
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor={cores.suave}
              value={nome}
              onChangeText={(texto) => {
                setNome(texto);
                setErro('');
              }}
              accessibilityLabel="Nome"
              autoComplete="name"
            />
          </View>

          <Text style={styles.rotulo}>Telefone</Text>
          <View style={styles.campo}>
            <Ionicons name="call-outline" size={20} color={cores.suave} />
            <TextInput
              style={styles.input}
              placeholder="(11) 98888-7777"
              placeholderTextColor={cores.suave}
              keyboardType="phone-pad"
              value={telefone}
              onChangeText={(texto) => {
                setTelefone(texto);
                setErro('');
              }}
              accessibilityLabel="Telefone"
              autoComplete="tel"
            />
          </View>
          {erro ? <Text style={styles.erro}>{erro}</Text> : null}
        </View>
      </View>
      <View style={styles.rodape}>
        <BotaoPrincipal titulo={enviando ? 'Entrando...' : 'Continuar'} desativado={enviando} onPress={confirmar} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  topo: { paddingHorizontal: 24, paddingTop: 8 },
  conteudo: { flex: 1, padding: 24 },
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
  erro: { fontFamily: fontes.media, fontSize: 14, color: cores.destaque },
  rodape: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
});
