import {
  DynamoDBDocumentClient,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ────────────────────────────── Helpers ──────────────────────────────────── */

process.env.DDB_TABLE = 'test-table';

const buildEvent = (body?: unknown): APIGatewayProxyEventV2 =>
  ({
    body: body ? JSON.stringify(body) : undefined,
  } as unknown as APIGatewayProxyEventV2);

/* ────────────────────────────── Mock DynamoDB ────────────────────────────── */

const send = jest.fn();
jest
  .spyOn(DynamoDBDocumentClient, 'from')
  .mockReturnValue({ send } as unknown as DynamoDBDocumentClient);

import { handler } from '../handler';

/* ────────────────────────────── Tests ────────────────────────────────────── */

describe('store-data handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    send.mockResolvedValue({});
  });

  it('persiste item y devuelve 201', async () => {
    const res = (await handler(
      buildEvent({ foo: 'bar' }),
      {} as any,
      undefined as any,
    )) as APIGatewayProxyStructuredResultV2;

    expect(send).toHaveBeenCalledTimes(1);

    const cmd = send.mock.calls[0][0] as PutCommand;
    expect(cmd.input.TableName).toBe('test-table');
    expect(cmd.input.Item).toMatchObject({
      pk: 'CUSTOM',
      data: { foo: 'bar' },
    });

    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body!).pk).toBe('CUSTOM');
  });

  it('devuelve 400 cuando body falta', async () => {
    const res = (await handler(
      buildEvent(),
      {} as any,
      undefined as any,
    )) as APIGatewayProxyStructuredResultV2;

    expect(send).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });

  it('devuelve 500 si DynamoDB falla', async () => {
    send.mockRejectedValueOnce(new Error('boom'));

    const res = (await handler(
      buildEvent({ foo: 'bar' }),
      {} as any,
      undefined as any,
    )) as APIGatewayProxyStructuredResultV2;

    expect(send).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(500);
  });
});
