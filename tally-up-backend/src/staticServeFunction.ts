import type { APIGatewayProxyResultV2 } from "aws-lambda";
import fs from "fs";

export const handler = async (): Promise<APIGatewayProxyResultV2> => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/javascript",
    },
    body: fs.readFileSync("./main.js", "utf-8"),
  };
};