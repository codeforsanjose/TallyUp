import type { BaseResponseModel, PostMealsResponseModel } from './gen/zod/schemas.ts';
import { postMealsBody } from './gen/zod/tally-up-api';
import { authDependency } from './lib/auth/auth-dependency.ts';
import { getJwtKey } from './lib/auth/get-jwt-key.ts';
import { getDbClient } from './lib/db';
import { buildHttpHandlerV2, type ActionResult } from './lib/lambda-utils/build-http-handler-v2';
import {
  defineGetDependenciesFn,
  mergeDependencies,
  type DependencyOf,
} from './lib/lambda-utils/build-http-handler-v2/dependencies';
import { parseEventDependency } from './lib/lambda-utils/build-http-handler-v2/parse-event-dependency';
import { fakeGetSecretValue, getSecretValue } from './lib/secrets.ts';

const getPostMealDeps = mergeDependencies(
  authDependency(['admin', 'staff', 'volunteer']),
  parseEventDependency({
    body: postMealsBody,
  }),
  defineGetDependenciesFn(async () => {
    const { DB_URL_SECRET_ARN, JWT_SECRET_ARN } = process.env;
    if (!DB_URL_SECRET_ARN || !JWT_SECRET_ARN) {
      throw new Error(
        'DB_URL_SECRET_ARN or JWT_SECRET_ARN is not defined in environment variables',
      );
    }

    return {
      client: await getDbClient({
        dbSecretArn: DB_URL_SECRET_ARN,
        getSecretValue: process.env.NODE_ENV === 'production' ? getSecretValue : fakeGetSecretValue,
      }),
      jwtKey: await getJwtKey({
        jwtSecretArn: JWT_SECRET_ARN,
        getSecretValue: process.env.NODE_ENV === 'production' ? getSecretValue : fakeGetSecretValue,
      }),
    };
  }),
);

export const getPostMealAction = async (
  deps: DependencyOf<typeof getPostMealDeps>,
): Promise<ActionResult<PostMealsResponseModel | BaseResponseModel>> => {
  const { parsedEvent, verifyAccessToken, client, jwtKey } = deps;

  const user = await verifyAccessToken(jwtKey);
  if ('statusCode' in user) return user;

  if (!parsedEvent.success) {
    return {
      statusCode: 400,
      body: { message: parsedEvent.error.message },
    };
  }

  const {
    body: { adult, inventory, youth },
  } = parsedEvent.data;
  const result = await client.insert(client._.fullSchema.meals).values({
    staffCreatorId: user.userId,
    adult,
    inventory,
    youth,
    quantity: inventory,
  });
  if (!result.rowCount) {
    return {
      statusCode: 500,
      body: { message: 'Failed to create meal' },
    };
  }

  return {
    statusCode: 201,
    body: {
      message: 'Meal created successfully',
    },
  };
};

export const handler = buildHttpHandlerV2({
  getDependencies: getPostMealDeps,
  action: getPostMealAction,
});
