import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuid } from 'uuid';

const TABLE_NAME = process.env.DDB_TABLE as string;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const buildItem = (body: unknown) => ({
  pk: 'CUSTOM',
  sk: `${new Date().toISOString()}#${uuid()}`,
  data: body,
});

export const handler: APIGatewayProxyHandlerV2 = async event => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'JSON body required' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const item = buildItem(body);

    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      }),
    );

    return {
      statusCode: 201,
      body: JSON.stringify(item),
    };
  } catch (error) {
    console.error('store-data error', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};