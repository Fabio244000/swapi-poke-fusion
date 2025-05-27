import type { APIGatewayProxyHandler } from 'aws-lambda';

export const hello: APIGatewayProxyHandler = async () => ({
  statusCode: 200,
  body: JSON.stringify({ message: 'Hello from TypeScript 👋' }),
});