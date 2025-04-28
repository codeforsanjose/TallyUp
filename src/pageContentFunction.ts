import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";

const dashboard = '<div>Dashboard</div>';
const login = '<div>Login</div>';

export const handler = async (req: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
  if (!req.requestContext.authentication) {
    return {
      statusCode: 200,
      body: login,
    };
  }

  return {
    statusCode: 200,
    body: dashboard,
  };
}