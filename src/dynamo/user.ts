import {
  type DynamoDBDocumentClient,
  PutCommand,
  type PutCommandInput,
  QueryCommand,
  type QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import type { Result } from '../lib/types';
import { z } from 'zod';

const UserModel = z.object({
  id: z.string(),
  email: z.string().email(),
  passwordHash: z.string(),
});

export type User = z.infer<typeof UserModel>;

const prefix = 'USER#';
const PK = (u: Pick<User, 'email'>) => `${prefix}${u.email}`;
const SK = (u: Pick<User, 'id'>) => `${prefix}${u.id}`;
const newUser = (email: string, passwordHash: string): User => ({
  id: crypto.randomUUID(),
  email,
  passwordHash,
});

const get = async (
  client: DynamoDBDocumentClient,
  email: string,
  tableName: string,
): Promise<Result<User>> => {
  const input: QueryCommandInput = {
    TableName: tableName,
    KeyConditionExpression: 'PK = :pk and begins_with(SK, :sk)',
    ExpressionAttributeValues: { ':pk': PK({ email }), ':sk': prefix },
    Limit: 1,
  };

  try {
    const result = await client.send(new QueryCommand(input));
    if (!result.Items) return { success: false, error: new Error('User not found') };
    const user = UserModel.safeParse(result.Items[0]);
    if (!user.success) return { success: false, error: new Error('Invalid user data') };
    return { success: true, data: user.data };
  } catch (error) {
    return { success: false, error };
  }
};

const put = async (
  client: DynamoDBDocumentClient,
  user: User,
  tableName: string,
): Promise<Result<void>> => {
  const input: PutCommandInput = {
    TableName: tableName,
    Item: {
      PK: PK(user),
      SK: SK(user),
      ...user,
    },
  };

  try {
    await client.send(new PutCommand(input));
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error };
  }
};

export const users = { PK, SK, newUser, get, put };
