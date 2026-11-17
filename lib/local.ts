export type Ponto = {
  latitude: number;
  longitude: number;
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties?: { city?: string; state?: string; country?: string };
};

function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function distanciaKm(origem: Ponto, destino: Ponto) {
  const paraRad = (graus: number) => (graus * Math.PI) / 180;
  const dLat = paraRad(destino.latitude - origem.latitude);
  const dLng = paraRad(destino.longitude - origem.longitude);
  const lat1 = paraRad(origem.latitude);
  const lat2 = paraRad(destino.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function formatarDistancia(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace('.', ',')} km`;
}

export function linkTransporte(origem: Ponto, destino: Ponto, plataforma: string) {
  const saida = `${origem.latitude},${origem.longitude}`;
  const chegada = `${destino.latitude},${destino.longitude}`;
  if (plataforma === 'ios') {
    return `https://maps.apple.com/?saddr=${saida}&daddr=${chegada}&dirflg=r`;
  }
  return `https://www.google.com/maps/dir/?api=1&origin=${saida}&destination=${chegada}&travelmode=transit`;
}

export async function geocodificar(endereco: string, cidade: string): Promise<Ponto | null> {
  const params = new URLSearchParams({
    q: `${endereco}, ${cidade}`,
    limit: '5',
  });
  const resposta = await fetch(`https://photon.komoot.io/api/?${params}`);
  if (!resposta.ok) throw new Error('geocodificar');

  const dados = (await resposta.json()) as { features?: PhotonFeature[] };
  const cidadeNorm = normalizar(cidade);
  const features = dados.features ?? [];
  const escolhido =
    features.find((item) => normalizar(item.properties?.city ?? '').includes(cidadeNorm)) ??
    features.find((item) => normalizar(item.properties?.state ?? '').includes(cidadeNorm));

  if (!escolhido) return null;
  const [longitude, latitude] = escolhido.geometry.coordinates;
  return { latitude, longitude };
}
