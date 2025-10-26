const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require("@aws-sdk/client-bedrock-agent-runtime");
const path = require('path');

// Asegurar que estamos en el directorio correcto para cargar .env
const envPath = path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });

const client = new BedrockAgentRuntimeClient({ 
  region: process.env.AWS_REGION || "eu-west-1"
});

async function invokeAgent(question) {
  const agentId = process.env.AGENT_ID;
  const agentAliasId = process.env.AGENT_ALIAS_ID;

  if (!agentId || !agentAliasId) {
    throw new Error('AGENT_ID and AGENT_ALIAS_ID must be set. Run: npm run test:e2e:setup');
  }

  if (!question || question.trim() === '') {
    throw new Error('Question is required');
  }

  try {
    const command = new InvokeAgentCommand({
      agentId: agentId,
      agentAliasId: agentAliasId,
      sessionId: `test-session-${Date.now()}`,
      inputText: question,
    });
    
    const response = await client.send(command);
    
    let fullResponse = "";
    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk?.bytes) {
          const text = new TextDecoder().decode(chunk.chunk.bytes);
          fullResponse += text;
        }
      }
    }

    return fullResponse || 'Empty response received';
  } catch (error) {
    throw new Error(`Agent invocation failed: ${error.message}`);
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  const question = process.argv[2];
  
  if (!question) {
    console.error('Usage: node invoke-agent.js "your question here"');
    process.exit(1);
  }
  
  invokeAgent(question)
    .then(response => {
      // Solo output limpio para Promptfoo
      process.stdout.write(response);
    })
    .catch(error => {
      process.stderr.write(error.message);
      process.exit(1);
    });
}

module.exports = { invokeAgent };