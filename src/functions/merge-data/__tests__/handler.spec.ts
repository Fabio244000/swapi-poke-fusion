import { handler } from '../handler';
import * as swapi from '../../../services/swapi.service';
import * as pokeapi from '../../../services/pokeapi.service';
import * as cache from '../../../shared/redis-cache';
import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

jest.mock('../../../services/swapi.service');
jest.mock('../../../services/pokeapi.service');
jest.mock('../../../shared/redis-cache');

describe('merge-data handler', () => {
  const fakePerson  = { name: 'A', height: '1', mass: '2', hair_color:'h', skin_color:'s', eye_color:'e', birth_year:'b', gender:'g' };
  const fakePokemon = { name: 'p', height: 1, weight: 2, base_experience: 3, types: [] };
  const merged      = { person: fakePerson, pokemon: fakePokemon };

  beforeEach(() => {
    (cache.get  as jest.Mock).mockResolvedValue(null);      // por defecto → MISS
    (cache.set  as jest.Mock).mockResolvedValue(undefined);
    (swapi.fetchSwapiResource as jest.Mock).mockResolvedValue(fakePerson);
    (pokeapi.fetchPokemon     as jest.Mock).mockResolvedValue(fakePokemon);
  });

  it('devuelve 200 y fusiona datos (cache MISS)', async () => {
    const res = await handler(
      { queryStringParameters: { personId: '1', pokemon: 'pikachu' } } as any,
      {} as any,
      undefined as any
    ) as APIGatewayProxyStructuredResultV2;

    expect(cache.get).toHaveBeenCalledWith('1:pikachu');
    expect(cache.set).toHaveBeenCalledWith('1:pikachu', merged, expect.any(Number));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body!)).toEqual(merged);
  });

  it('devuelve 200 con datos desde caché (cache HIT)', async () => {
    (cache.get as jest.Mock).mockResolvedValue(merged);    // fuerza HIT

    const res = await handler(
      { queryStringParameters: { personId: '1', pokemon: 'pikachu' } } as any,
      {} as any,
      undefined as any
    ) as APIGatewayProxyStructuredResultV2;

    expect(cache.get).toHaveBeenCalledWith('1:pikachu');
    expect(cache.set).not.toHaveBeenCalled();              // no escribe si ya existe
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body!)).toEqual(merged);
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
