import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

const buildGetDbConnectionSecret = () => {
  let dbConnectionSecret: secretsmanager.Secret | undefined;
  return (stack: cdk.Stack) => {
    if (dbConnectionSecret) return dbConnectionSecret;
    dbConnectionSecret = new secretsmanager.Secret(stack, 'dbConnectionSecret');
    return dbConnectionSecret;
  };
};

export const getDbConnectionSecret = buildGetDbConnectionSecret();

const buildGetJwtSecret = () => {
  let jwtSecret: secretsmanager.Secret | undefined;
  return (stack: cdk.Stack) => {
    if (jwtSecret) return jwtSecret;
    jwtSecret = new secretsmanager.Secret(stack, 'jwtSecret', {
      generateSecretString: {
        requireEachIncludedType: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // TODO: Change to RETAIN for production
    });
    return jwtSecret;
  };
};

export const getJwtSecret = buildGetJwtSecret();
