import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { fetchSwapiResource } from '../../services/swapi.service';
import { fetchPokemon } from '../../services/pokeapi.service';
import { mergeNormalized } from '../../utils/normalizer';
import * as cache from '../../shared/redis-cache';   // ← nueva import

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const personId  = event.queryStringParameters?.personId ?? '1';
    const pokemonId = event.queryStringParameters?.pokemon  ?? 'pikachu';
    const cacheKey  = `${personId}:${pokemonId}`;             // e.g. "5:charizard"

    /* ---------- 1) Intentar cache hit ---------- */
    const cached = await cache.get<any>(cacheKey);
    if (cached) {
      console.log('Redis HIT', cacheKey);
      return { statusCode: 200, body: JSON.stringify(cached) };
    }

    /* ---------- 2) Llamadas a APIs externas ---------- */
    const [swapiRaw, pokeRaw] = await Promise.all([
      fetchSwapiResource(`people/${personId}`),
      fetchPokemon(pokemonId),
    ]);

    /* ---------- 3) Normalizar → fusionar ---------- */
    const payload = mergeNormalized(swapiRaw, pokeRaw);

    /* ---------- 4) Guardar en caché ---------- */
    await cache.set(cacheKey, payload);

    return { statusCode: 200, body: JSON.stringify(payload) };
  } catch (err) {
    console.error('merge-data error', err);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
  }
};
