import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as BedrockAgentCdk from '../../lib/bedrock-agent-cdk-stack';

describe('BedrockAgentCdkStack', () => {
  test('Bedrock Agent Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new BedrockAgentCdk.BedrockAgentCdkStack(app, 'MyTestStack');
    // THEN
    const template = Template.fromStack(stack);

    // Test que el agente Bedrock se crea correctamente
    template.hasResourceProperties('AWS::Bedrock::Agent', {
      AgentName: 'BrewBot',
      FoundationModel: 'amazon.nova-lite-v1:0'
    });
  });

  test('IAM Role Created with Correct Permissions', () => {
    const app = new cdk.App();
    const stack = new BedrockAgentCdk.BedrockAgentCdkStack(app, 'MyTestStack');
    const template = Template.fromStack(stack);

    // Test que el rol IAM se crea con los permisos correctos
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'bedrock.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        }]
      }
    });
  });

  test('Agent Alias Created', () => {
    const app = new cdk.App();
    const stack = new BedrockAgentCdk.BedrockAgentCdkStack(app, 'MyTestStack');
    const template = Template.fromStack(stack);

    // Test que el alias del agente se crea
    template.hasResourceProperties('AWS::Bedrock::AgentAlias', {
      AgentAliasName: 'brewBot'
    });
  });

  test('Stack has correct tags', () => {
    const app = new cdk.App();
    const stack = new BedrockAgentCdk.BedrockAgentCdkStack(app, 'MyTestStack');
    const template = Template.fromStack(stack);

    // Verificar que los recursos tienen los tags correctos
    template.hasResourceProperties('AWS::Bedrock::Agent', {
      Tags: {
        Environment: 'D',
        Application: 'GENERIC_UNSPECIFIED'
      }
    });
  });
});