import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';

// ------------------------------
// Axios Setup
// ------------------------------
export const pokeapiClient: AxiosInstance = axios.create({
  baseURL: 'https://pokeapi.co/api/v2',
  timeout: 10000,
});

axiosRetry(pokeapiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: error => axiosRetry.isNetworkOrIdempotentRequestError(error),
});

// ------------------------------
// Método 1: Axios (original)
// ------------------------------
export async function fetchPokemonAxios<T = any>(identifier: string | number): Promise<T> {
  try {
    console.log(`[fetchPokemonAxios] Iniciando llamada a PokeAPI con ID=${identifier}`);
    const response = await pokeapiClient.get<T>(`/pokemon/${identifier}`);
    console.log(`[fetchPokemonAxios] Respuesta exitosa de PokeAPI:`, JSON.stringify(response.data));
    return response.data;
  } catch (error: any) {
    console.error(`[fetchPokemonAxios] Error en petición a PokeAPI con ID=${identifier}:`, error);
    throw error;
  }
}

// ------------------------------
// Método 2: Fetch nativo (Node.js 18+)
// ------------------------------
export async function fetchPokemonFetch<T = any>(identifier: string | number): Promise<T> {
  const url = `https://pokeapi.co/api/v2/pokemon/${identifier}`;
  console.log(`[fetchPokemonFetch] Iniciando fetch a: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`[fetchPokemonFetch] Respuesta no OK: ${response.status}`);
    }
    const data = (await response.json()) as T;
    console.log(`[fetchPokemonFetch] Datos recibidos vía fetch:`, JSON.stringify(data));
    return data;
  } catch (error: any) {
    console.error(`[fetchPokemonFetch] Error en fetch con ID=${identifier}:`, error);
    throw error;
  }
}

// ------------------------------
// Wrapper para validar ambas formas
// ------------------------------
export async function fetchPokemon<T = any>(identifier: string | number): Promise<T> {
  console.log(`[fetchPokemon] Probando ambas formas de invocación a PokeAPI con ID=${identifier}`);

  try {
    const viaAxios = await fetchPokemonAxios<T>(identifier);
    return viaAxios;
  } catch (errorAxios) {
    console.error(`[fetchPokemon] Axios falló. Intentando con fetch...`);
    const viaFetch = await fetchPokemonFetch<T>(identifier);
    return viaFetch;
  }
}
