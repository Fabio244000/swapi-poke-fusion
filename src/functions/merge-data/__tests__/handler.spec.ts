import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

/* ────────────────────────────── Mocks ────────────────────────────────────── */

jest.mock('../../../services/swapi.service', () => ({
  fetchSwapiResource: jest.fn().mockResolvedValue({ name: 'Luke' }),
}));

jest.mock('../../../services/pokeapi.service', () => ({
  fetchPokemon: jest.fn().mockResolvedValue({ name: 'pikachu' }),
}));

jest.mock('../../../shared/redis-cache', () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
}));

import { handler } from '../handler';
import * as cache from '../../../shared/redis-cache';
import * as swapi from '../../../services/swapi.service';
import * as pokeapi from '../../../services/pokeapi.service';

/* ───────────────────────────── Helpers ───────────────────────────────────── */

const buildEvent = (
  personId = '1',
  pokemon = 'pikachu',
): APIGatewayProxyEventV2 =>
  ({
    queryStringParameters: { personId, pokemon },
  } as unknown as APIGatewayProxyEventV2);

/* ───────────────────────────── Tests ─────────────────────────────────────── */

describe('merge-data handler', () => {
  afterEach(() => jest.clearAllMocks());

  it('cache MISS → llama APIs y guarda en Redis', async () => {
    const res = (await handler(
      buildEvent('3', 'bulbasaur'),
      {} as any,
      undefined as any,
    )) as APIGatewayProxyStructuredResultV2;

    expect(cache.get).toHaveBeenCalledWith('3:bulbasaur');
    expect(swapi.fetchSwapiResource).toHaveBeenCalledWith('people/3');
    expect(pokeapi.fetchPokemon).toHaveBeenCalledWith('bulbasaur');
    expect(cache.set).toHaveBeenCalledWith('3:bulbasaur', expect.any(Object));
    expect(res.statusCode).toBe(200);
  });

  it('cache HIT → no llama APIs ni escribe', async () => {
    (cache.get as jest.Mock).mockResolvedValueOnce({ hit: true });

    const res = (await handler(buildEvent(), {} as any, undefined as any)) as
      APIGatewayProxyStructuredResultV2;

    expect(cache.get).toHaveBeenCalledWith('1:pikachu');
    expect(swapi.fetchSwapiResource).not.toHaveBeenCalled();
    expect(pokeapi.fetchPokemon).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it('retorna 500 cuando alguna llamada falla', async () => {
    (swapi.fetchSwapiResource as jest.Mock).mockRejectedValueOnce(new Error('fail'));

    const res = (await handler(buildEvent(), {} as any, undefined as any)) as
      APIGatewayProxyStructuredResultV2;

    expect(cache.set).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(500);
  });
});
