'use strict';

const _ = require('lodash');
const BbPromise = require('bluebird');

module.exports = {
  compileApiKeys() {
    const apiKeys = _.get(this.serverless.service.provider.apiGateway, 'apiKeys')
      || this.serverless.service.provider.apiKeys;
    if (apiKeys) {
      if (!Array.isArray(apiKeys)) {
        throw new this.serverless.classes.Error('apiKeys property must be an array');
      }

      _.forEach(apiKeys, (apiKey, i) => {
        const apiKeyNumber = i + 1;

        const finalApiKey = apiKey.name || apiKey;
        const isApiKeyString = typeof finalApiKey !== 'string';

        if (isApiKeyString) {
          throw new this.serverless.classes.Error('API Keys must be strings');
        }

        const apiKeyLogicalId = this.provider.naming
          .getApiKeyLogicalId(apiKeyNumber);

        _.merge(this.serverless.service.provider.compiledCloudFormationTemplate.Resources, {
          [apiKeyLogicalId]: {
            Type: 'AWS::ApiGateway::ApiKey',
            Properties: {
              Enabled: true,
              Name: finalApiKey,
              StageKeys: [{
                RestApiId: { Ref: this.apiGatewayRestApiLogicalId },
                StageName: this.provider.getStage(),
              }],
            },
            DependsOn: this.apiGatewayDeploymentLogicalId,
          },
        });
      });
    }
    return BbPromise.resolve();
  },
};
