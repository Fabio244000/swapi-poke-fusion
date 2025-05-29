import axios from 'axios';

const api = axios.create({
  baseURL: process.env.OFFLINE_URL ?? 'http://localhost:3000',
  validateStatus: () => true, // evitamos lanzar excepciones por estados ≠ 2xx
});

describe('POST /store  ➜  GET /history (offline)', () => {
  const sample = { hello: 'world' };

  it(
    'almacena un ítem y luego lo recupera como primer elemento del historial',
    async () => {
      /* ----------------------- POST /store ----------------------- */
      const postRes = await api.post('/store', sample);

      expect(postRes.status).toBe(201);
      expect(postRes.data).toEqual(
        expect.objectContaining({
          pk: 'CUSTOM',
          sk: expect.any(String),
          data: sample,
        }),
      );

      /* ---------------------- GET /history ----------------------- */
      const listRes = await api.get('/history', { params: { limit: 1 } });

      expect(listRes.status).toBe(200);
      expect(listRes.data.items).toHaveLength(1);

      const [first] = listRes.data.items;
      expect(first.data).toEqual(sample);
    },
    20_000, // timeout ms
  );
});
