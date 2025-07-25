import { Stack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';

export const instantiateTallyUpGithubActionsRole = (stack: Stack, branch: 'main' | 'staging') => {
  const tallyupGithubActionsRole = new iam.Role(stack, 'tallyupGithubActionsRole', {
    assumedBy: new iam.WebIdentityPrincipal(
      'arn:aws:iam::253016134262:oidc-provider/token.actions.githubusercontent.com',
      {
        StringLike: {
          'token.actions.githubusercontent.com:sub': [
            `repo:codeforsanjose/TallyUp:ref:refs/heads/${branch}`,
          ],
        },
        'ForAllValues:StringEquals': {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:iss': 'https://token.actions.githubusercontent.com',
        },
      },
    ),
    managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess')],
    inlinePolicies: {
      DenyExpensiveServiceAccess: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.DENY,
            actions: [
              'ec2:*',
              'glue:*',
              'sagemaker:*',
              'athena:*',
              'emr:*',
              'redshift:*',
              'kinesis:*',
              'redshift:*',
              'rds:*',
              'dynamodb:*',
            ],
            resources: ['*'],
          }),
        ],
      }),
    },
  });

  return tallyupGithubActionsRole;
};
