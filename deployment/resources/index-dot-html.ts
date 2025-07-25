import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
export const instantiateIndexDotHtml = (stack: cdk.Stack) => {
  const indexDotHtml = new s3.Bucket(stack, 'indexDotHtml', {
    blockPublicAccess: new s3.BlockPublicAccess({
      blockPublicAcls: false,
      blockPublicPolicy: false,
      ignorePublicAcls: true,
      restrictPublicBuckets: false,
    }),
    websiteErrorDocument: 'index.html',
    websiteIndexDocument: 'index.html',
    publicReadAccess: true,
    removalPolicy: cdk.RemovalPolicy.DESTROY, // TODO: Change to RETAIN for production
    autoDeleteObjects: true, // TODO: Change to false for production
  });

  indexDotHtml.addToResourcePolicy(
    new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [indexDotHtml.arnForObjects('*')],
      effect: iam.Effect.ALLOW,
      principals: [new iam.AnyPrincipal()],
    }),
  );

  return indexDotHtml;
};
