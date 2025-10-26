const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function setupTestEnvironment() {
  try {
    console.log('Getting CDK outputs...');
    
    // Cambiar al directorio raíz del proyecto (ahora desde test/e2e/)
    const projectRoot = path.join(__dirname, '../..');
    process.chdir(projectRoot);
    
    // Obtener nombre del stack
    const stacks = execSync('cdk list', { encoding: 'utf8' }).trim().split('\n');
    const stackName = stacks[0];
    
    if (!stackName) {
      throw new Error('No CDK stacks found. Make sure the stack is deployed.');
    }
    
    console.log(`Found stack: ${stackName}`);
    
    // Obtener outputs del stack
    const outputsRaw = execSync(
      `aws cloudformation describe-stacks --stack-name ${stackName} --query 'Stacks[0].Outputs' --output json`, 
      { encoding: 'utf8' }
    );
    const cdkOutputs = JSON.parse(outputsRaw);
    
    // Extraer AgentId y AgentAliasId
    const agentId = cdkOutputs.find(o => o.OutputKey === 'AgentId')?.OutputValue;
    let agentAliasId = cdkOutputs.find(o => o.OutputKey === 'AgentAliasId')?.OutputValue;
    
    // ARREGLO: Si el agentAliasId viene en formato "AGENTID|ALIASID", extraer solo el ALIASID
    if (agentAliasId && agentAliasId.includes('|')) {
      agentAliasId = agentAliasId.split('|')[1];
      console.log(`Extracted alias ID from compound format: ${agentAliasId}`);
    }
    
    if (!agentId || !agentAliasId) {
      throw new Error('Could not find AgentId or AgentAliasId in CDK outputs. Make sure the stack is deployed.');
    }
    
    // Validar que el agentAliasId cumpla con los requisitos
    if (agentAliasId.length > 10 || !/^[0-9a-zA-Z]+$/.test(agentAliasId)) {
      throw new Error(`Invalid agentAliasId format: ${agentAliasId}. Must be max 10 alphanumeric characters.`);
    }
    
    // Crear archivo .env en el directorio de tests E2E
    const envPath = path.join(__dirname, '.env');
    const envContent = `AGENT_ID=${agentId}\nAGENT_ALIAS_ID=${agentAliasId}\nAWS_REGION=eu-west-1\n`;
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Test environment setup complete!');
    console.log(`AgentId: ${agentId}`);
    console.log(`AgentAliasId: ${agentAliasId}`);
    console.log(`Environment file created at: ${envPath}`);
    
  } catch (error) {
    console.error('❌ Error setting up test environment:', error.message);
    process.exit(1);
  }
}

setupTestEnvironment();