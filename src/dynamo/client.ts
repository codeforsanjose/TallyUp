import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const base = new DynamoDBClient({});
export const client = DynamoDBDocumentClient.from(base, {
  marshallOptions: { removeUndefinedValues: true },
});
