// src/functions/merge-data/__tests__/handler.spec.ts
import { handler } from '../handler';
import * as swapi from '../../../services/swapi.service';
import * as pokeapi from '../../../services/pokeapi.service';
import * as cache from '../../../shared/redis-cache';
import { mergeNormalized } from '../../../utils/normalizer';
import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

// ───────────────────────────────────────────────────────────────────────────────
// Mocks
// ───────────────────────────────────────────────────────────────────────────────
jest.mock('../../../services/swapi.service');
jest.mock('../../../services/pokeapi.service');
jest.mock('../../../shared/redis-cache');

// ───────────────────────────────────────────────────────────────────────────────
// Datos base
// ───────────────────────────────────────────────────────────────────────────────
const fakePerson  = {
  name: 'A',
  height: '1',
  mass: '2',
  hair_color: 'h',
  skin_color: 's',
  eye_color: 'e',
  birth_year: 'b',
  gender: 'g',
};

const fakePokemon = {
  name: 'p',
  height: 1,
  weight: 2,
  base_experience: 3,
  types: [],
};

// La salida real que produce mergeNormalized (camelCase + números)
const normalized = mergeNormalized(fakePerson, fakePokemon);

// ───────────────────────────────────────────────────────────────────────────────
// Tests
// ───────────────────────────────────────────────────────────────────────────────
describe('merge-data handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();                                  // <─ limpia contadores

    // Por defecto simulamos “cache MISS”
    (cache.get as jest.Mock).mockResolvedValue(null);
    (cache.set as jest.Mock).mockResolvedValue(undefined);

    (swapi.fetchSwapiResource as jest.Mock).mockResolvedValue(fakePerson);
    (pokeapi.fetchPokemon as jest.Mock).mockResolvedValue(fakePokemon);
  });

  it('devuelve 200 y fusiona datos (cache MISS)', async () => {
    const res = await handler(
      { queryStringParameters: { personId: '1', pokemon: 'pikachu' } } as any,
      {} as any,
      undefined as any,
    ) as APIGatewayProxyStructuredResultV2;

    expect(cache.get).toHaveBeenCalledWith('1:pikachu');
    expect(cache.set).toHaveBeenCalledWith('1:pikachu', normalized); // 2 args
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body!)).toEqual(normalized);
  });

  it('devuelve 200 con datos desde caché (cache HIT)', async () => {
    (cache.get as jest.Mock).mockResolvedValue(normalized);          // fuerza HIT

    const res = await handler(
      { queryStringParameters: { personId: '1', pokemon: 'pikachu' } } as any,
      {} as any,
      undefined as any,
    ) as APIGatewayProxyStructuredResultV2;

    expect(cache.get).toHaveBeenCalledWith('1:pikachu');
    expect(cache.set).not.toHaveBeenCalled();                        // no re-escribe
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body!)).toEqual(normalized);
  });

  it('usa valores por defecto (personId=1, pokemon=pikachu)', async () => {
    const res = await handler({} as any, {} as any, undefined as any) as APIGatewayProxyStructuredResultV2;

    expect(cache.get).toHaveBeenCalledWith('1:pikachu');
    expect(res.statusCode).toBe(200);
  });

  it('responde 500 si alguna llamada externa lanza error', async () => {
    (swapi.fetchSwapiResource as jest.Mock).mockRejectedValueOnce(new Error('fail'));

    const res = await handler({} as any, {} as any, undefined as any) as APIGatewayProxyStructuredResultV2;

    expect(res.statusCode).toBe(500);
  });
});
