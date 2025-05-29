import {
  DynamoDBDocumentClient,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

const send = jest.fn().mockResolvedValue({
  Items: [{ pk: 'CUSTOM', sk: 'x', data: {} }],
});
jest.spyOn(DynamoDBDocumentClient, 'from').mockReturnValue({ send } as any);

import { handler } from '../handler';

describe('get-history handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    send.mockResolvedValue({
      Items: [{ pk: 'CUSTOM', sk: 'x', data: {} }],
    });
  });

  it('consulta historial y devuelve 200', async () => {
    const res = await handler({} as any, {} as any, undefined as any) as APIGatewayProxyStructuredResultV2;

    expect(send).toHaveBeenCalledWith(expect.any(QueryCommand));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body!).items.length).toBe(1);
  });
});
