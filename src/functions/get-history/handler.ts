// src/functions/get-history/handler.ts
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const TABLE = process.env.DDB_TABLE!;
const ddb   = DynamoDBDocumentClient.from(new DynamoDBClient({}));

function decodeToken(t?: string) {
  return t ? JSON.parse(Buffer.from(t, 'base64').toString()) : undefined;
}
function encodeToken(k?: Record<string, any>) {
  return k ? Buffer.from(JSON.stringify(k)).toString('base64') : undefined;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const limit      = Number(event.queryStringParameters?.limit ?? 10);
    const nextToken  = decodeToken(event.queryStringParameters?.nextToken);

    const { Items, LastEvaluatedKey } = await ddb.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': 'CUSTOM' },
      ScanIndexForward: false,             // DESC por fecha
      Limit: limit,
      ExclusiveStartKey: nextToken,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: Items ?? [],
        nextToken: encodeToken(LastEvaluatedKey),
      }),
    };
  } catch (err) {
    console.error('get-history error', err);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
  }
};
