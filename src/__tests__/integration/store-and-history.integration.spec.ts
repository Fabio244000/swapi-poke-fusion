// src/__tests__/integration/store-and-history.integration.spec.ts
import axios from 'axios';

describe('Integration store + history (offline)', () => {
  it('POST /almacenar y luego GET /historial', async () => {
    const sample = { hello: 'world' };

    // 1) almacena
    const post = await axios.post('http://localhost:3000/almacenar', sample);
    expect(post.status).toBe(201);

    // 2) lista
    const list = await axios.get('http://localhost:3000/historial?limit=1');
    expect(list.status).toBe(200);
    expect(list.data.items[0].data).toEqual(sample);
  }, 15000);
});
