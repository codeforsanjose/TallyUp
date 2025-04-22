import type { APIGatewayProxyResultV2 } from 'aws-lambda';
import fs from 'fs';

export const handler = async (): Promise<APIGatewayProxyResultV2> => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: fs.readFileSync('./index.html', 'utf-8')
  }
}
