import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { cores, fontes, raio, sombra } from '../constants/tema';

type BotaoPrincipalProps = {
  titulo: string;
  onPress: () => void;
  desativado?: boolean;
  icone?: ComponentProps<typeof Ionicons>['name'];
};

export function BotaoPrincipal({
  titulo,
  onPress,
  desativado,
  icone = 'arrow-forward',
}: BotaoPrincipalProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: desativado }}
      disabled={desativado}
      onPress={onPress}
      style={({ pressed }) => [
        styles.principal,
        pressed && styles.pressionado,
        desativado && styles.desativado,
      ]}
    >
      <Text style={styles.principalTexto}>{titulo}</Text>
      <Ionicons name={icone} size={20} color={cores.sobreDestaque} />
    </Pressable>
  );
}

export function BotaoVoltar() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      hitSlop={8}
      onPress={() => router.back()}
      style={({ pressed }) => [styles.voltar, pressed && styles.pressionado]}
    >
      <Ionicons name="chevron-back" size={22} color={cores.tinta} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  principal: {
    ...sombra,
    minHeight: 58,
    borderRadius: raio.m,
    backgroundColor: cores.destaque,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  principalTexto: { fontFamily: fontes.negrito, fontSize: 17, color: cores.sobreDestaque },
  pressionado: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  desativado: { opacity: 0.4 },
  voltar: {
    ...sombra,
    width: 44,
    height: 44,
    borderRadius: raio.pilula,
    backgroundColor: cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
