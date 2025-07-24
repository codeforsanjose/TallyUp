import { Fn, Stack } from 'aws-cdk-lib';
import type { HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cfOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';

type DistributionSettings = {
  indexDotHtml: s3.Bucket;
  apiMain: HttpApi;
  hasCustomDomain: boolean;
  customDomainName?: string;
  customDomainCertificateArn?: string;
};

export const instantiateCloudFrontDistribution = (stack: Stack, params: DistributionSettings) => {
  const { indexDotHtml, apiMain, hasCustomDomain, customDomainName, customDomainCertificateArn } =
    params;

  const apiDomain = Fn.select(2, Fn.split('/', apiMain.apiEndpoint));
  const cloudfrontDistribution = new cloudfront.Distribution(stack, 'cloudfrontDistribution', {
    defaultBehavior: {
      origin: new cfOrigins.S3StaticWebsiteOrigin(indexDotHtml, {
        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
      }),
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      compress: true,
      originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
    },
    additionalBehaviors: {
      '/api/*': {
        origin: new cfOrigins.HttpOrigin(apiDomain, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
        }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      },
    },
    priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    domainNames: hasCustomDomain ? [customDomainName!] : undefined,
    certificate: hasCustomDomain
      ? Certificate.fromCertificateArn(
          stack,
          'CustomDomainCertificate',
          customDomainCertificateArn!,
        )
      : undefined,
  });

  return cloudfrontDistribution;
};
