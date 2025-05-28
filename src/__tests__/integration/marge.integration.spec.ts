// src/__tests__/integration/merge.integration.spec.ts
import axios from 'axios';

describe('Integration /merge (offline)', () => {
  // Arranca antes el serverless offline con IS_OFFLINE=true
  it('devuelve merge correcto para personId y pokemon', async () => {
    const res = await axios.get('http://localhost:3000/merge?personId=3&pokemon=bulbasaur');
    expect(res.status).toBe(200);
    expect(res.data.person.name).toBeDefined();
    expect(res.data.pokemon.name).toBeDefined();
  }, 15000);
});
