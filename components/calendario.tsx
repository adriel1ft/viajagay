import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cores, fontes, raio } from '../constants/tema';
import { gradeDoMes, isoDe, mesSeguinte, nomeDia, tituloMes } from '../lib/datas';

const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

type CalendarioProps = {
  inicio: string | null;
  fim: string | null;
  onChange: (inicio: string | null, fim: string | null) => void;
};

export function Calendario({ inicio, fim, onChange }: CalendarioProps) {
  const hoje = new Date();
  const [visivel, setVisivel] = useState({ ano: hoje.getFullYear(), mes: hoje.getMonth() + 1 });
  const celulas = gradeDoMes(visivel.ano, visivel.mes);
  const semanas: (number | null)[][] = [];
  for (let i = 0; i < celulas.length; i += 7) semanas.push(celulas.slice(i, i + 7));

  function escolher(iso: string) {
    if (!inicio || fim || iso < inicio) {
      onChange(iso, null);
      return;
    }
    onChange(inicio, iso);
  }

  return (
    <View style={styles.calendario}>
      <View style={styles.navegacao}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          onPress={() => setVisivel(mesSeguinte(visivel.ano, visivel.mes, -1))}
          style={styles.seta}
        >
          <Ionicons name="chevron-back" size={18} color={cores.tinta} />
        </Pressable>
        <Text style={styles.mes}>{tituloMes(visivel.ano, visivel.mes)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
          onPress={() => setVisivel(mesSeguinte(visivel.ano, visivel.mes, 1))}
          style={styles.seta}
        >
          <Ionicons name="chevron-forward" size={18} color={cores.tinta} />
        </Pressable>
      </View>

      <View style={styles.semana}>
        {SEMANA.map((letra, indice) => (
          <Text key={`${letra}-${indice}`} style={styles.semanaLetra}>
            {letra}
          </Text>
        ))}
      </View>

      {semanas.map((semana, linha) => (
        <View key={linha} style={styles.semana}>
          {semana.map((dia, coluna) => {
            if (!dia) return <View key={`${linha}-${coluna}`} style={styles.dia} />;
            const iso = isoDe(visivel.ano, visivel.mes, dia);
            const extremo = iso === inicio || iso === fim;
            const noIntervalo = Boolean(inicio && fim && iso > inicio && iso < fim);
            return (
              <Pressable
                key={iso}
                accessibilityRole="button"
                accessibilityLabel={nomeDia(iso)}
                accessibilityState={{ selected: extremo || noIntervalo }}
                onPress={() => escolher(iso)}
                style={[styles.dia, noIntervalo && styles.diaIntervalo, extremo && styles.diaExtremo]}
              >
                <Text style={[styles.diaTexto, (extremo || noIntervalo) && styles.diaTextoMarcado, extremo && styles.diaTextoExtremo]}>
                  {dia}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  calendario: { gap: 4 },
  navegacao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  mes: { fontFamily: fontes.negrito, fontSize: 16, color: cores.tinta },
  seta: {
    width: 36,
    height: 36,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.fundo,
  },
  semana: { flexDirection: 'row' },
  semanaLetra: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fontes.semi,
    fontSize: 12,
    color: cores.suave,
    paddingVertical: 6,
  },
  dia: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: raio.p },
  diaIntervalo: { backgroundColor: cores.destaqueSuave, borderRadius: 0 },
  diaExtremo: { backgroundColor: cores.destaque, borderRadius: raio.p },
  diaTexto: { fontFamily: fontes.media, fontSize: 15, color: cores.tinta },
  diaTextoMarcado: { fontFamily: fontes.negrito },
  diaTextoExtremo: { color: cores.sobreDestaque },
});
