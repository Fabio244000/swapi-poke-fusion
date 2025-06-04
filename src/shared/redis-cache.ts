import { createClient } from 'redis';

const client = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

async function connect() {
  if (!client.isOpen) await client.connect();
}


export async function get<T>(key: string): Promise<T | null> {
  await client.connect();
  const v = await client.get(key);
  await client.quit();
  return v ? JSON.parse(v) as T : null;
}

export async function set<T>(key: string, value: T, ttl = Number(process.env.REDIS_TTL)): Promise<void> {
  await client.connect();
  await client.set(key, JSON.stringify(value), { EX: ttl });
  await client.quit();
}

export async function del(key: string): Promise<void> {
  await connect();
  await client.del(key);
}
