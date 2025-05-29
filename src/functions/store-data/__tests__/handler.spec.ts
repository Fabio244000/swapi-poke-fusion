// src/functions/store-data/__tests__/handler.spec.ts
import { handler } from '../handler';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

jest.mock('@aws-sdk/lib-dynamodb');

describe('store-data handler', () => {
  const send = jest.fn().mockResolvedValue({});
  beforeAll(() => {
    (DynamoDBDocumentClient.from as jest.Mock).mockReturnValue({ send });
  });
  beforeEach(() => jest.clearAllMocks());

  it('graba item y devuelve 201', async () => {
    const res = await handler(
      { body: JSON.stringify({ foo: 'bar' }) } as any,
      {} as any,
      undefined as any,
    ) as APIGatewayProxyStructuredResultV2;

    expect(send).toHaveBeenCalledWith(expect.any(PutCommand));
    expect(res.statusCode).toBe(201);
  });

  it('valida body', async () => {
    const res = await handler({} as any, {} as any, undefined as any) as APIGatewayProxyStructuredResultV2;
    expect(res.statusCode).toBe(400);
  });
});
