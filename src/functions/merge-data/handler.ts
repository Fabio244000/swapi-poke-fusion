import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { fetchSwapiResource } from '../../services/swapi.service';
import { fetchPokemon } from '../../services/pokeapi.service';
import { mergeNormalized } from '../../utils/normalizer';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // Parámetros opcionales desde queryString (default: personId=1, pokemon='pikachu')
    const personId  = event.queryStringParameters?.personId  ?? '1';
    const pokemonId = event.queryStringParameters?.pokemon   ?? 'pikachu';

    // Llamadas en paralelo a SWAPI y PokéAPI
    const [swapiRaw, pokeRaw] = await Promise.all([
      fetchSwapiResource(`people/${personId}`),
      fetchPokemon(pokemonId),
    ]);

    // Normaliza y combina ambos resultados
    const payload = mergeNormalized(swapiRaw, pokeRaw);

    return {
      statusCode: 200,
      body: JSON.stringify(payload),
    };
  } catch (error: any) {
    console.error('merge-data handler error', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};

