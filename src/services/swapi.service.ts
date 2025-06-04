import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import https from 'https';

const isOffline = Boolean(process.env.IS_OFFLINE);
const httpsAgent = isOffline
  ? new https.Agent({ rejectUnauthorized: false })
  : undefined;

export const swapiClient: AxiosInstance = axios.create({
  baseURL: 'https://swapi.dev/api',
  timeout: 10000,
  ...(httpsAgent ? { httpsAgent } : {}),
});

axiosRetry(swapiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: error => axiosRetry.isNetworkOrIdempotentRequestError(error),
});

export async function fetchSwapiResource<T = any>(endpoint: string): Promise<T> {
  try {
    console.log(`[fetchSwapiResource] Iniciando llamada a SWAPI con endpoint=${endpoint}`);
    const response = await swapiClient.get<T>(`/${endpoint}`);
    console.log(`[fetchSwapiResource] Respuesta exitosa de SWAPI:`, JSON.stringify(response.data));
    return response.data;
  } catch (error: any) {
    console.error(`[fetchSwapiResource] Error en petición a SWAPI con endpoint=${endpoint}:`, error);
    throw error;
  }
}
