import MockAdapter from 'axios-mock-adapter';
import { pokeapiClient, fetchPokemon } from '../pokeapi.service';

describe('fetchPokemon', () => {
  const mock = new MockAdapter(pokeapiClient);
  afterEach(() => mock.reset());

  it('devuelve datos correctos para un nombre', async () => {
    const dummy = { id: 25, name: 'pikachu' };
    mock.onGet('/pokemon/pikachu').reply(200, dummy);
    const data = await fetchPokemon('pikachu');
    expect(data).toEqual(dummy);
  });

  it('rechaza si no existe', async () => {
    mock.onGet('/pokemon/unknown').reply(404);
    await expect(fetchPokemon('unknown')).rejects.toThrow();
  });
});
