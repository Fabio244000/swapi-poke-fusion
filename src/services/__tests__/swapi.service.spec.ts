import MockAdapter from 'axios-mock-adapter';
import { swapiClient, fetchSwapiResource } from '../swapi.service';

describe('fetchSwapiResource', () => {
  const mock = new MockAdapter(swapiClient);
  afterEach(() => mock.reset());

  it('devuelve datos correctos para un endpoint', async () => {
    const dummy = { name: 'Test' };
    mock.onGet('/people/1').reply(200, dummy);
    const data = await fetchSwapiResource('people/1');
    expect(data).toEqual(dummy);
  });

  it('lanza error en caso de 500', async () => {
    mock.onGet('/fail').reply(500);
    await expect(fetchSwapiResource('fail')).rejects.toThrow();
  });
});
