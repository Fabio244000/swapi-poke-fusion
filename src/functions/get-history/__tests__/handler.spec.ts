import {
  DynamoDBDocumentClient,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const encodeToken = (k?: Record<string, unknown>) =>
  k ? Buffer.from(JSON.stringify(k)).toString('base64') : undefined;

/* -------------------------------------------------------------------------- */
/* Mocks                                                                      */
/* -------------------------------------------------------------------------- */

// intercepta solo `.from` y devuelve un cliente con `send`
const send = jest.fn();
jest.spyOn(DynamoDBDocumentClient, 'from').mockReturnValue({ send } as any);

// importar el handler *después* de setear el spy
import { handler } from '../handler';

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe('get-history handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devuelve 200 con el límite solicitado', async () => {
    send.mockResolvedValueOnce({ Items: [], LastEvaluatedKey: undefined });

    const res = (await handler(
      { queryStringParameters: { limit: '5' } } as any,
      {} as any,
      undefined as any,
    )) as APIGatewayProxyStructuredResultV2;

    // Verifica el comando que se envió a DynamoDB
    const cmd = (send.mock.calls[0][0] as QueryCommand).input;
    expect(cmd.Limit).toBe(5);
    expect(cmd.ExclusiveStartKey).toBeUndefined();

    // Respuesta correcta
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body!).items).toHaveLength(0);
  });

  it('propaga nextToken y devuelve 200', async () => {
    const lastKey = { pk: 'CUSTOM', sk: 'prev' };
    send.mockResolvedValueOnce({
      Items: [{ pk: 'CUSTOM', sk: 'new', data: {} }],
      LastEvaluatedKey: lastKey,
    });

    const res = (await handler(
      { queryStringParameters: { nextToken: encodeToken(lastKey) } } as any,
      {} as any,
      undefined as any,
    )) as APIGatewayProxyStructuredResultV2;

    const cmd = (send.mock.calls[0][0] as QueryCommand).input;
    expect(cmd.ExclusiveStartKey).toEqual(lastKey);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body!);
    expect(body.items).toHaveLength(1);
    expect(body.nextToken).toBe(encodeToken(lastKey)); // el handler debe re-codificar
  });

  it('maneja errores y responde 500', async () => {
    send.mockRejectedValueOnce(new Error('dynamo down'));

    const res = (await handler({} as any, {} as any, undefined as any)) as
      APIGatewayProxyStructuredResultV2;

    expect(res.statusCode).toBe(500);
  });
});
