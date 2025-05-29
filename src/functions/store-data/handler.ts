// src/functions/store-data/handler.ts
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuid } from 'uuid';

const TABLE = process.env.DDB_TABLE!;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ message: 'JSON body required' }) };
    }

    const payload = JSON.parse(event.body);         // ⬅ datos “personalizados”
    const now      = new Date().toISOString();
    const item = {
      pk: 'CUSTOM',                                 // misma partición para todo el historial
      sk: `${now}#${uuid()}`,                       // orden cronológico + id único
      data: payload,
    };

    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));

    return { statusCode: 201, body: JSON.stringify(item) };
  } catch (err) {
    console.error('store-data error', err);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
  }
};
