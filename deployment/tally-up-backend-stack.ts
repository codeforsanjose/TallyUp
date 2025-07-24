import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import path from 'path';
import tallyupConfig from '../tallyup.config';
import { instantiateHttpFunction } from './lib/http-function';
import { instantiateCloudFrontDistribution } from './resources/cloudfront-distribution';
import { instantiateIndexDotHtml } from './resources/index-dot-html';
import { instantiateTallyUpGithubActionsRole } from './resources/tallyup-github-actions-role';
import assert from 'assert';

export interface TallyUpBackendStackProps extends cdk.StackProps {
  /**
   * Custom domain name for the API
   */
  readonly customDomainName?: string;
  /**
   * ARN of the ACM certificate for the custom domain
   */
  readonly customDomainCertificateArn?: string;

  readonly branch: 'main' | 'staging';
}

/**
 * tally-up-backend
 */
export class TallyUpBackendStack extends cdk.Stack {
  public constructor(scope: cdk.App, id: string, props: TallyUpBackendStackProps) {
    super(scope, id, props);

    // Applying default props
    props = {
      ...props,
      customDomainName: props.customDomainName ?? 'tallyup.opensourcesanjose.org',
      customDomainCertificateArn:
        props.customDomainCertificateArn ??
        'arn:aws:acm:us-east-1:253016134262:certificate/fe98691e-f11c-45eb-84c7-64c98d6e588c',
    };
    assert(props.branch, 'Branch must be specified in TallyUpBackendStackProps');

    // Conditions
    const hasCustomDomain = !(props.customDomainName! === '');

    // Resources
    const argon2Layer = new lambda.LayerVersion(this, 'argon2Layer', {
      code: lambda.Code.fromAsset(
        `${path.resolve(__dirname, '../layers/argon2/argon2-layer.zip')}`,
      ),
      layerVersionName: 'argon2Layer',
      description: 'Argon2 layer for Tally Up',
      removalPolicy: cdk.RemovalPolicy.DESTROY, // TODO: Figure out if RETAIN is better for prod
      license: 'MIT',
    });

    const apiMain = new apigatewayv2.HttpApi(this, 'ApiMain', {
      apiName: 'TallyUpApi',
      description: 'Main API for TallyUp',
    });

    const indexDotHtml = instantiateIndexDotHtml(this);

    instantiateTallyUpGithubActionsRole(this, props.branch);

    tallyupConfig.functions.forEach((fnCfg) => {
      const { outDir, name, managedPolicyNames, method, path, layers } = fnCfg;
      instantiateHttpFunction({
        codePath: outDir,
        managedPolicyNames,
        name,
        stack: this,
        route: {
          api: apiMain,
          method: method as apigatewayv2.HttpMethod,
          path,
          stage: apiMain.defaultStage,
          timeoutInMillis: layers?.argon2 ? 10000 : 5000,
        },
        layers: layers?.argon2 ? [argon2Layer] : undefined,
      });
    });

    instantiateCloudFrontDistribution(this, {
      indexDotHtml,
      apiMain,
      hasCustomDomain,
      customDomainName: props.customDomainName,
      customDomainCertificateArn: props.customDomainCertificateArn,
    });

    new cdk.CfnOutput(this, 'CfnOutputS3BucketName', {
      key: 'S3BucketName',
      description: 'S3 bucket name for index.html',
      value: `s3://${indexDotHtml.bucketName}`,
    });
  }
}
