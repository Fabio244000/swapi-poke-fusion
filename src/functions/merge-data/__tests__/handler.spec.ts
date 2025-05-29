import {
  DynamoDBDocumentClient,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

type EventQuery = Record<string, string | undefined>;

const buildEvent = (query: EventQuery = {}): APIGatewayProxyEventV2 =>
  ({ queryStringParameters: query } as unknown as APIGatewayProxyEventV2);

const toBase64 = (obj: Record<string, unknown>) =>
  Buffer.from(JSON.stringify(obj)).toString('base64');

/* -------------------------------------------------------------------------- */
/* DynamoDB mock setup                                                        */
/* -------------------------------------------------------------------------- */

const send = jest.fn();
jest
  .spyOn(DynamoDBDocumentClient, 'from')         // mock solo el factory
  .mockReturnValue({ send } as unknown as DynamoDBDocumentClient);

import { handler } from '../handler';

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('get-history handler', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 200 and respects the limit parameter', async () => {
    send.mockResolvedValueOnce({ Items: [], LastEvaluatedKey: undefined });

    const res = (await handler(
      buildEvent({ limit: '5' }),
      {} as any,
      undefined as any,
    )) as APIGatewayProxyStructuredResultV2;

    expect(send).toHaveBeenCalledTimes(1);

    const cmdInput = (send.mock.calls[0][0] as QueryCommand).input;
    expect(cmdInput.Limit).toBe(5);
    expect(cmdInput.ExclusiveStartKey).toBeUndefined();

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body!).items).toHaveLength(0);
  });

  it('honours nextToken pagination', async () => {
    const lastKey = { pk: 'CUSTOM', sk: 'prev' };
    send.mockResolvedValueOnce({
      Items: [{ pk: 'CUSTOM', sk: 'new', data: {} }],
      LastEvaluatedKey: lastKey,
    });

    const res = (await handler(
      buildEvent({ nextToken: toBase64(lastKey) }),
      {} as any,
      undefined as any,
    )) as APIGatewayProxyStructuredResultV2;

    const cmdInput = (send.mock.calls[0][0] as QueryCommand).input;
    expect(cmdInput.ExclusiveStartKey).toEqual(lastKey);

    const body = JSON.parse(res.body!);
    expect(res.statusCode).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.nextToken).toBe(toBase64(lastKey));
  });

  it('returns 500 when DynamoDB fails', async () => {
    send.mockRejectedValueOnce(new Error('dynamo down'));

    const res = (await handler(
      buildEvent(),
      {} as any,
      undefined as any,
    )) as APIGatewayProxyStructuredResultV2;

    expect(send).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(500);
  });
});
