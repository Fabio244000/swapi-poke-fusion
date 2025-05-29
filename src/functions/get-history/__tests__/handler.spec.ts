// src/functions/get-history/__tests__/handler.spec.ts
import { handler } from '../handler';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

jest.mock('@aws-sdk/lib-dynamodb');

describe('get-history handler', () => {
  const send = jest.fn().mockResolvedValue({ Items: [{ pk: 'CUSTOM', sk: 'x', data: {} }] });
  beforeAll(() => {
    (DynamoDBDocumentClient.from as jest.Mock).mockReturnValue({ send });
  });
  beforeEach(() => jest.clearAllMocks());

  it('consulta historial y devuelve 200', async () => {
    const res = await handler({} as any, {} as any, undefined as any) as APIGatewayProxyStructuredResultV2;
    expect(send).toHaveBeenCalledWith(expect.any(QueryCommand));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body!).items.length).toBe(1);
  });
});
