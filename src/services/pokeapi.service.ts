import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';


export const pokeapiClient: AxiosInstance = axios.create({
  baseURL: 'https://pokeapi.co/api/v2',
  timeout: 5000,
});

axiosRetry(pokeapiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: error => axiosRetry.isNetworkOrIdempotentRequestError(error),
});

export async function fetchPokemon<T = any>(identifier: string | number): Promise<T> {
  const response = await pokeapiClient.get<T>(`/pokemon/${identifier}`);
  return response.data;
}
