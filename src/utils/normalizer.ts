/**
 * Tipos normalizados para SWAPI y PokéAPI
 */
export interface NormalizedPerson {
  name: string;
  height: number;
  mass: number;
  hairColor: string;
  skinColor: string;
  eyeColor: string;
  birthYear: string;
  gender: string;
}

export interface NormalizedPokemon {
  name: string;
  height: number;
  weight: number;
  baseExperience: number;
  types: string[];
}

export interface MergedData {
  person: NormalizedPerson;
  pokemon: NormalizedPokemon;
}

/**
 * Convierte cualquier valor a número, devolviendo 0 si no es válido.
 */
function toNumber(value: any): number {
  let num: number;
  if (typeof value === 'string') {
    num = parseFloat(value);
  } else if (typeof value === 'number') {
    num = value;
  } else {
    return 0;
  }
  return Number.isFinite(num) ? num : 0;
}

/**
 * Normaliza la respuesta de SWAPI (person) a un objeto más tipado.
 */
export function normalizeSwapiPerson(raw: any): NormalizedPerson {
  return {
    name: raw.name,
    height: toNumber(raw.height),
    mass: toNumber(raw.mass),
    hairColor: raw.hair_color,
    skinColor: raw.skin_color,
    eyeColor: raw.eye_color,
    birthYear: raw.birth_year,
    gender: raw.gender,
  };
}

/**
 * Normaliza la respuesta de PokéAPI (pokemon) a un objeto más tipado.
 */
export function normalizePokemon(raw: any): NormalizedPokemon {
  return {
    name: raw.name,
    height: toNumber(raw.height),
    weight: toNumber(raw.weight),
    baseExperience: toNumber(raw.base_experience),
    types: Array.isArray(raw.types)
      ? raw.types.map((t: any) => t.type?.name ?? '')
      : [],
  };
}

/**
 * Combina y normaliza ambas respuestas para la ruta /merge
 */
export function mergeNormalized(rawSwapi: any, rawPoke: any): MergedData {
  const person = normalizeSwapiPerson(rawSwapi);
  const pokemon = normalizePokemon(rawPoke);
  return { person, pokemon };
}