import {
  DynamoDBDocumentClient,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const buildEvent = (body?: unknown): APIGatewayProxyEventV2 =>
  ({ body: body ? JSON.stringify(body) : undefined } as unknown as APIGatewayProxyEventV2);

/* -------------------------------------------------------------------------- */
/* DynamoDB mock                                                              */
/* -------------------------------------------------------------------------- */

const send = jest.fn();
jest
  .spyOn(DynamoDBDocumentClient, 'from')
  .mockReturnValue({ send } as unknown as DynamoDBDocumentClient);

// importa el handler **después** de configurar el mock
import { handler } from '../handler';

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('store-data handler', () => {
  afterEach(() => jest.clearAllMocks());

  it('persists item and returns 201', async () => {
    send.mockResolvedValueOnce({});

    const res = (await handler(
      buildEvent({ foo: 'bar' }),
      {} as any,
      undefined as any,
    )) as APIGatewayProxyStructuredResultV2;

    expect(send).toHaveBeenCalledTimes(1);

    const cmd = send.mock.calls[0][0] as PutCommand;
    expect(cmd.input.TableName).toMatch(/swapi-poke-fusion/);
    expect(cmd.input.Item).toMatchObject({ pk: 'CUSTOM', data: { foo: 'bar' } });

    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body!).pk).toBe('CUSTOM');
  });

  it('returns 400 when body is missing', async () => {
    const res = (await handler(
      buildEvent(),
      {} as any,
      undefined as any,
    )) as APIGatewayProxyStructuredResultV2;

    expect(send).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body!).message).toBe('JSON body required');
  });

  it('returns 500 on DynamoDB error', async () => {
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
