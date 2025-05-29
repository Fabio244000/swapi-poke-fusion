import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.DDB_TABLE as string;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const decodeToken = (token?: string) =>
  token ? JSON.parse(Buffer.from(token, 'base64').toString()) : undefined;

const encodeToken = (key?: Record<string, unknown>) =>
  key ? Buffer.from(JSON.stringify(key)).toString('base64') : undefined;

export const handler: APIGatewayProxyHandlerV2 = async event => {
  const limit = Number(event.queryStringParameters?.limit ?? 10);
  const exclusiveKey = decodeToken(event.queryStringParameters?.nextToken);

  try {
    const { Items = [], LastEvaluatedKey } = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': 'CUSTOM' },
        ScanIndexForward: false, // newest first
        Limit: limit,
        ExclusiveStartKey: exclusiveKey,
      }),
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: Items,
        nextToken: encodeToken(LastEvaluatedKey),
      }),
    };
  } catch (error) {
    console.error('get-history error', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
