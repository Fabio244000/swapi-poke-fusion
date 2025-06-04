import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { fetchSwapiResource } from '../../services/swapi.service';
import { fetchPokemon } from '../../services/pokeapi.service';
import { mergeNormalized } from '../../utils/normalizer';
import * as cache from '../../shared/redis-cache';

const DEFAULT_PERSON = '1';
const DEFAULT_POKEMON = 'pikachu';

export const handler: APIGatewayProxyHandlerV2 = async event => {
  // 1. Logueamos el evento completo al entrar (útil para ver headers, body, etc.)
  console.log('[handler] Event received:', JSON.stringify(event));

  // 2. Extraemos y logueamos los parámetros (o usamos defaults)
  const personId  = event.queryStringParameters?.personId ?? DEFAULT_PERSON;
  const pokemonId = event.queryStringParameters?.pokemon  ?? DEFAULT_POKEMON;
  console.log(`[handler] Parámetros extraídos → personId=${personId}, pokemonId=${pokemonId}`);

  // 3. Construimos la clave de caché y la logueamos
  const cacheKey  = `${personId}:${pokemonId}`;
  console.log(`[handler] Cache key generada: "${cacheKey}"`);

  try {
    // 4. Intentamos obtener del cache y logueamos el resultado
    const cached = await cache.get<unknown>(cacheKey);
    if (cached) {
      console.log(`[handler] Redis HIT → key=${cacheKey}. Devolviendo datos cacheados.`);
      return {
        statusCode: 200,
        body: JSON.stringify(cached),
      };
    }
    console.log(`[handler] Redis MISS → key=${cacheKey}. Continuando con fetch de APIs.`);

    // 5. Antes de llamar a las APIs, logueamos
    console.log(`[handler] Llamando a Swapi y PokeAPI en paralelo...`);
    console.log(`[handler] - Swapi resource: people/${personId}`);
    console.log(`[handler] - PokeAPI: ${pokemonId}`);

    // 6. Realizamos las dos peticiones en paralelo
    const [swapiRaw, pokeRaw] = await Promise.all([
      fetchSwapiResource(`people/${personId}`),
      fetchPokemon(pokemonId),
    ]);

    // 7. Logueamos respuestas crudas (si no son muy grandes)
    console.log('[handler] Respuesta cruda de Swapi:', JSON.stringify(swapiRaw));
    console.log('[handler] Respuesta cruda de PokeAPI:', JSON.stringify(pokeRaw));

    // 8. Mergeamos y logueamos el resultado fusionado (normalizado)
    const merged = mergeNormalized(swapiRaw, pokeRaw);
    console.log('[handler] Datos fusionados (merged):', JSON.stringify(merged));

    // 9. Guardamos en cache y logueamos la confirmación
    await cache.set(cacheKey, merged);
    console.log(`[handler] Datos guardados en Redis → key=${cacheKey}`);

    // 10. Devolvemos el resultado con log de respuesta exitosa
    console.log('[handler] Devolviendo status 200 con datos fusionados');
    return {
      statusCode: 200,
      body: JSON.stringify(merged),
    };
  } catch (error) {
    // 11. En caso de error, logueamos detalles
    console.error('[handler] merge-data error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
