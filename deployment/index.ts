import { App } from 'aws-cdk-lib';
import { TallyUpBackendStack } from './tally-up-backend-stack';

const stackName = process.env['STACK_NAME']!;
const customDomainName = process.env['CUSTOM_DOMAIN_NAME']!;
const customDomainCertificateArn = process.env['CUSTOM_DOMAIN_CERTIFICATE_ARN']!;

const app = new App();
new TallyUpBackendStack(app, stackName, {
  branch: process.env['BRANCH'] as 'main' | 'staging',
  customDomainName,
  customDomainCertificateArn,
});
