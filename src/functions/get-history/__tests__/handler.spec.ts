import {
  DynamoDBDocumentClient,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ────────────────────────────── Helpers ──────────────────────────────────── */

process.env.DDB_TABLE = 'test-table';

const buildEvent = (query: Record<string, string> = {}): APIGatewayProxyEventV2 =>
  ({ queryStringParameters: query } as unknown as APIGatewayProxyEventV2);

const encode = (obj: Record<string, unknown>) =>
  Buffer.from(JSON.stringify(obj)).toString('base64');

/* ────────────────────────────── Mock DynamoDB ────────────────────────────── */

const send = jest.fn();
jest
  .spyOn(DynamoDBDocumentClient, 'from')
  .mockReturnValue({ send } as unknown as DynamoDBDocumentClient);

import { handler } from '../handler';

/* ────────────────────────────── Tests ────────────────────────────────────── */

describe('get-history handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    send.mockResolvedValue({
      Items: [],
      LastEvaluatedKey: undefined,
    });
  });

  it('respeta el parámetro limit', async () => {
    await handler(buildEvent({ limit: '5' }), {} as any, undefined as any);

    expect(send).toHaveBeenCalledTimes(1);
    const input = (send.mock.calls[0][0] as QueryCommand).input;
    expect(input.Limit).toBe(5);
  });

  it('maneja nextToken y devuelve 200', async () => {
    const lastKey = { pk: 'CUSTOM', sk: 'prev' };
    send.mockResolvedValueOnce({
      Items: [{ pk: 'CUSTOM', sk: 'new', data: {} }],
      LastEvaluatedKey: lastKey,
    });

    const res = (await handler(
      buildEvent({ nextToken: encode(lastKey) }),
      {} as any,
      undefined as any,
    )) as APIGatewayProxyStructuredResultV2;

    expect(send).toHaveBeenCalledTimes(1);
    const cmd = send.mock.calls[0][0] as QueryCommand;
    expect(cmd.input.ExclusiveStartKey).toEqual(lastKey);

    const body = JSON.parse(res.body!);
    expect(body.items).toHaveLength(1);
    expect(body.nextToken).toBe(encode(lastKey));
  });

  it('devuelve 500 cuando DynamoDB falla', async () => {
    send.mockRejectedValueOnce(new Error('dynamo down'));

    const res = (await handler(buildEvent(), {} as any, undefined as any)) as
      APIGatewayProxyStructuredResultV2;

    expect(send).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(500);
  });
});
