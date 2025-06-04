import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';

export const pokeapiClient: AxiosInstance = axios.create({
  baseURL: 'https://pokeapi.co/api/v2',
  timeout: 10000,
});

axiosRetry(pokeapiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: error => axiosRetry.isNetworkOrIdempotentRequestError(error),
});

export async function fetchPokemon<T = any>(identifier: string | number): Promise<T> {
  try {
    console.log(`[fetchPokemon] Iniciando llamada a PokeAPI con ID=${identifier}`);
    const response = await pokeapiClient.get<T>(`/pokemon/${identifier}`);
    console.log(`[fetchPokemon] Respuesta exitosa de PokeAPI:`, JSON.stringify(response.data));
    return response.data;
  } catch (error: any) {
    console.error(`[fetchPokemon] Error en petición a PokeAPI con ID=${identifier}:`, error);
    throw error;
  }
}
