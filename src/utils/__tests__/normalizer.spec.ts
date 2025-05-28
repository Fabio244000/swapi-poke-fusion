import { normalizeSwapiPerson, normalizePokemon, mergeNormalized } from '../normalizer';

describe('normalizer', () => {
  it('normalizeSwapiPerson convierte correctamente campos numéricos y strings', () => {
    const raw = {
      name: 'Luke Skywalker',
      height: '172',
      mass: '77',
      hair_color: 'blond',
      skin_color: 'fair',
      eye_color: 'blue',
      birth_year: '19BBY',
      gender: 'male',
    };
    const p = normalizeSwapiPerson(raw);
    expect(p).toEqual({
      name: 'Luke Skywalker',
      height: 172,
      mass: 77,
      hairColor: 'blond',
      skinColor: 'fair',
      eyeColor: 'blue',
      birthYear: '19BBY',
      gender: 'male',
    });
  });

  it('normalizePokemon extrae tipos y convierte números', () => {
    const raw = {
      name: 'pikachu',
      height: '4',
      weight: '60',
      base_experience: '112',
      types: [{ slot: 1, type: { name: 'electric', url: '' } }],
    };
    const pk = normalizePokemon(raw);
    expect(pk).toEqual({
      name: 'pikachu',
      height: 4,
      weight: 60,
      baseExperience: 112,
      types: ['electric'],
    });
  });

  it('mergeNormalized combina ambos objetos', () => {
    const merged = mergeNormalized(
      { name: 'A', height: '1', mass: '2', hair_color: 'h', skin_color: 's', eye_color: 'e', birth_year: 'b', gender: 'g' },
      { name: 'p', height: 1, weight: 2, base_experience: 3, types: [] }
    );
    expect(merged.person.name).toBe('A');
    expect(merged.pokemon.name).toBe('p');
  });

  // ————————————— Nuevos tests para ramas no cubiertas —————————————

  it('toNumber devuelve 0 si los campos numéricos no son parseables', () => {
    const raw = {
      name: 'X',
      height: 'foo',
      mass: 'bar',
      hair_color: '',
      skin_color: '',
      eye_color: '',
      birth_year: 'unknown',
      gender: '',
    };
    const p = normalizeSwapiPerson(raw as any);
    expect(p.height).toBe(0);
    expect(p.mass).toBe(0);
  });

  it('normalizePokemon maneja types no-array y valores no numéricos', () => {
    const raw: any = {
      name: 'weirdmon',
      height: 'NaN',
      weight: '∞',
      base_experience: null,
      types: null,
    };
    const pk = normalizePokemon(raw);
    expect(pk.height).toBe(0);
    expect(pk.weight).toBe(0);
    expect(pk.baseExperience).toBe(0);
    expect(pk.types).toEqual([]);
  });
});
