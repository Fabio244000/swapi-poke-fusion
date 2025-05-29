import { handler } from '../handler';
import {
  DynamoDBDocumentClient,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

// ─── Preparamos un mock para `.send` ───────────────────────────────────────────
const send = jest.fn().mockResolvedValue({});

// espiamos (no mock completo)  ↓↓↓
jest.spyOn(DynamoDBDocumentClient, 'from').mockReturnValue({ send } as any);

describe('store-data handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    send.mockResolvedValue({});
  });

  it('graba item y devuelve 201', async () => {
    const res = await handler(
      { body: JSON.stringify({ foo: 'bar' }) } as any,
      {} as any,
      undefined as any,
    ) as APIGatewayProxyStructuredResultV2;

    expect(send).toHaveBeenCalledWith(expect.any(PutCommand));
    expect(res.statusCode).toBe(201);
  });

  it('valida body requerido', async () => {
    const res = await handler({} as any, {} as any, undefined as any) as APIGatewayProxyStructuredResultV2;
    expect(res.statusCode).toBe(400);
  });
});
