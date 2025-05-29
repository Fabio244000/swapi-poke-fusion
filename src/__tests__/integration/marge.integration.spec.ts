import axios from 'axios';

const api = axios.create({
  baseURL: process.env.OFFLINE_URL ?? 'http://localhost:3000',
  validateStatus: () => true, // evita lanzar si no es 2xx
});

describe('GET /merge (serverless-offline)', () => {
  const params = { personId: '3', pokemon: 'bulbasaur' };

  it(
    'devuelve payload fusionado y normalizado',
    async () => {
      const { status, data } = await api.get('/merge', { params });

      expect(status).toBe(200);

      expect(data).toEqual(
        expect.objectContaining({
          person: expect.objectContaining({
            name: expect.any(String),
            height: expect.any(Number),
            mass: expect.any(Number),
          }),
          pokemon: expect.objectContaining({
            name: 'bulbasaur',
            height: expect.any(Number),
            weight: expect.any(Number),
            baseExperience: expect.any(Number),
          }),
        }),
      );
    },
    20_000, // timeout ms
  );
});
