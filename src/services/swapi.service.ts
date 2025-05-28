import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import https from 'https';

// Detectamos si estamos en offline
const isOffline = Boolean(process.env.IS_OFFLINE);

// Creamos un https.Agent que NO rechace certificados expirados
const httpsAgent = isOffline
  ? new https.Agent({ rejectUnauthorized: false })
  : undefined;

// Exportamos el cliente para tests y para llamar a SWAPI
export const swapiClient: AxiosInstance = axios.create({
  baseURL: 'https://swapi.dev/api',
  timeout: 5000,
  ...(httpsAgent ? { httpsAgent } : {}),
});

axiosRetry(swapiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: error => axiosRetry.isNetworkOrIdempotentRequestError(error),
});

export async function fetchSwapiResource<T = any>(endpoint: string): Promise<T> {
  const response = await swapiClient.get<T>(`/${endpoint}`);
  return response.data;
}