import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';

export class BedrockAgentCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Agregar tags al stack
    cdk.Tags.of(this).add('Environment', 'D');
    cdk.Tags.of(this).add('Application', 'GENERIC_UNSPECIFIED');

    // Crear el rol IAM para el agente Bedrock con permisos específicos para Nova
    const agentRole = new iam.Role(this, 'BedrockAgentRole', {
      assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonBedrockFullAccess')
      ],
      inlinePolicies: {
        NovaInferenceProfileAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream'
              ],
              resources: [
                'arn:aws:bedrock:eu-west-1::foundation-model/amazon.nova-lite-v1:0',
                'arn:aws:bedrock:*::foundation-model/*'
              ]
            })
          ]
        })
      }
    });

    // Agregar tags al rol IAM
    cdk.Tags.of(agentRole).add('Environment', 'D');
    cdk.Tags.of(agentRole).add('Application', 'GENERIC_UNSPECIFIED');

    // Crear el agente Bedrock
    const agent = new cdk.CfnResource(this, "BrewBotAgent", {
      type: "AWS::Bedrock::Agent",
      properties: {
        AgentName: "BrewBot",
        AgentResourceRoleArn: agentRole.roleArn,
        FoundationModel: "eu.amazon.nova-lite-v1:0",
        Instruction: `You are BrewBot, an expert brewing assistant specialized EXCLUSIVELY in craft beer brewing.

IMPORTANT: You can ONLY help with topics related to:
- Craft beer brewing and beer making
- Beer recipes and ingredients (malts, hops, yeasts, water)
- Brewing techniques and fermentation
- Brewing equipment and tools
- Beer styles and characteristics
- Troubleshooting brewing problems
- Brewing calculations (IBU, SRM, ABV, gravity)

CRITICAL LANGUAGE RULE: Always respond ONLY in English, regardless of the language of the question.
Always be helpful and detailed when answering brewing-related questions in English.`,
        Description: "Expert brewing assistant created with CDK to help EXCLUSIVELY with craft beer brewing.",
        IdleSessionTTLInSeconds: 300,
        Tags: {
          Environment: "D",
          Application: "GENERIC_UNSPECIFIED"
        }
      },
    });

    // Crear el alias del agente
    const agentAlias = new cdk.CfnResource(this, "BrewBotAgentAlias", {
      type: "AWS::Bedrock::AgentAlias",
      properties: {
        AgentId: agent.ref,
        AgentAliasName: "brewBot",
        Tags: {
          Environment: "D",
          Application: "GENERIC_UNSPECIFIED"
        }
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'AgentId', {
      value: agent.ref,
      description: 'Bedrock Agent ID'
    });

    new cdk.CfnOutput(this, 'AgentAliasId', {
      value: agentAlias.ref,
      description: 'Bedrock Agent Alias ID'
    });
  }
}