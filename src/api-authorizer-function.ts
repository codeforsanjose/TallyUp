import type { APIGatewayAuthorizerHandler } from 'aws-lambda';

export const handler: APIGatewayAuthorizerHandler = async (event, context) => {
  console.log('Authorizer event:', JSON.stringify(event, null, 2));
  console.log('Authorizer context:', JSON.stringify(context, null, 2));
  throw new Error('Authorizer not implemented yet');
};
