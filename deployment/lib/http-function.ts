import { Duration, RemovalPolicy, type Stack } from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { getDbConnectionSecret, getJwtSecret } from './secrets';
import assert from 'assert';

type FunctionParams = {
  codePath: string;
  layers?: lambda.FunctionOptions['layers'];
  managedPolicyNames?: string[];
  name: string;
  route: {
    api: apigatewayv2.HttpApi;
    method: NonNullable<apigatewayv2.AddRoutesOptions['methods']>[number];
    path: string;
    stage: apigatewayv2.IHttpStage | undefined;
    timeoutInMillis?: number;
  };
  stack: Stack;
};

const buildGetLambdaLogs = () => {
  let lambdaLogs: logs.LogGroup | undefined;
  return (stack: Stack) => {
    if (lambdaLogs) return lambdaLogs;

    lambdaLogs = new logs.LogGroup(stack, 'lambdaLogs', {
      logGroupName: `/aws/lambda/${stack.stackName}`,
      retention: logs.RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY, // TODO: Change to RETAIN for production
    });
    return lambdaLogs;
  };
};

const getLambdaLogs = buildGetLambdaLogs();

export const instantiateHttpFunction = (params: FunctionParams): lambda.Function => {
  const { codePath, layers, managedPolicyNames, name, stack } = params;
  const { api, method, path, stage, timeoutInMillis } = params.route;
  assert(stage, 'Stage must be defined for HTTP function instantiation');

  const fn = new lambda.Function(stack, name, {
    // code: lambda.Code.fromAsset(`${tallyupConfig.outDir.functions}/login-function`),
    code: lambda.Code.fromAsset(codePath),
    handler: 'index.handler',
    memorySize: 128,
    role: new iam.Role(stack, `${name}Role`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: managedPolicyNames?.map((policyName) => {
        return iam.ManagedPolicy.fromAwsManagedPolicyName(policyName);
      }),
    }),
    runtime: lambda.Runtime.NODEJS_22_X,
    timeout: Duration.seconds(100),
    environment: {
      DB_URL_SECRET_ARN: getDbConnectionSecret(stack).secretArn,
      JWT_SECRET_ARN: getJwtSecret(stack).secretArn,
    },
    layers,
    architecture: lambda.Architecture.X86_64,
    logGroup: getLambdaLogs(stack),
  });

  api.addRoutes({
    path,
    methods: [method],
    integration: new integrations.HttpLambdaIntegration(`${name}Integration`, fn, {
      payloadFormatVersion: apigatewayv2.PayloadFormatVersion.VERSION_2_0,
      timeout: Duration.millis(timeoutInMillis ?? 5000),
    }),
  });

  fn.addPermission(`${name}ApiInvokePermission`, {
    action: 'lambda:InvokeFunction',
    principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    sourceArn: api.arnForExecuteApi(method, path, stage.stageName),
  });

  return fn;
};
