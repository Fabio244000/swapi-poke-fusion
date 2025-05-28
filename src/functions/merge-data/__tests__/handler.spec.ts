import { handler } from '../handler';
import * as swapi from '../../../services/swapi.service';
import * as pokeapi from '../../../services/pokeapi.service';
import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

jest.mock('../../../services/swapi.service');
jest.mock('../../../services/pokeapi.service');

describe('merge-data handler', () => {
  const fakePerson = {
    name: 'A', height: '1', mass: '2',
    hair_color: 'h', skin_color: 's',
    eye_color: 'e', birth_year: 'b',
    gender: 'g'
  };
  const fakePokemon = {
    name: 'p', height: 1, weight: 2,
    base_experience: 3, types: []
  };

  beforeAll(() => {
    (swapi.fetchSwapiResource as jest.Mock).mockResolvedValue(fakePerson);
    (pokeapi.fetchPokemon    as jest.Mock).mockResolvedValue(fakePokemon);
  });

  it('responde 200 con el payload mergeado', async () => {
    const res = await handler(
      { queryStringParameters: { personId: '1', pokemon: 'pikachu' } } as any,
      {} as any,      // <<< context simulado
      undefined as any       // <<< callback opcional
    ) as APIGatewayProxyStructuredResultV2;

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body!);
    expect(body.person.name).toBe(fakePerson.name);
    expect(body.pokemon.name).toBe(fakePokemon.name);
  });

  it('usa valores por defecto si no hay query params', async () => {
    const res = await handler(
      {} as any,
      {} as any,
      undefined as any
    ) as APIGatewayProxyStructuredResultV2;

    expect(res.statusCode).toBe(200);
  });

  it('responde 500 en caso de excepción', async () => {
    (swapi.fetchSwapiResource as jest.Mock).mockRejectedValueOnce(new Error('fail'));

    const res = await handler(
      {} as any,
      {} as any,
      undefined as any
    ) as APIGatewayProxyStructuredResultV2;

    expect(res.statusCode).toBe(500);
  });
});
