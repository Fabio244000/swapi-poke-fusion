import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { fetchSwapiResource } from '../../services/swapi.service';
import { fetchPokemon } from '../../services/pokeapi.service';
import { mergeNormalized } from '../../utils/normalizer';
import * as cache from '../../shared/redis-cache';

const DEFAULT_PERSON = '1';
const DEFAULT_POKEMON = 'pikachu';

export const handler: APIGatewayProxyHandlerV2 = async event => {
  const personId  = event.queryStringParameters?.personId ?? DEFAULT_PERSON;
  const pokemonId = event.queryStringParameters?.pokemon  ?? DEFAULT_POKEMON;
  const cacheKey  = `${personId}:${pokemonId}`;

  try {
    const cached = await cache.get<unknown>(cacheKey);
    if (cached) {
      console.log('Redis HIT', cacheKey);
      return {
        statusCode: 200,
        body: JSON.stringify(cached),
      };
    }

    const [swapiRaw, pokeRaw] = await Promise.all([
      fetchSwapiResource(`people/${personId}`),
      fetchPokemon(pokemonId),
    ]);

    const merged = mergeNormalized(swapiRaw, pokeRaw);
    await cache.set(cacheKey, merged);

    return {
      statusCode: 200,
      body: JSON.stringify(merged),
    };
  } catch (error) {
    console.error('merge-data error', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
