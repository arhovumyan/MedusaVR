const { exec } = require('child_process');

// Test the LoRA endpoint with curl to verify it receives the new parameters
const testLoraRequest = {
  prompt: "a beautiful woman with purple hair",
  characterId: "test-character-id",
  loraModel: "gothic.safetensors", // New LoRA system parameter
  loraStrength: 0.8,
  width: 1024,
  height: 1536,
  steps: 25,
  cfgScale: 8
};

const curlCommand = `curl -X POST http://localhost:8080/api/image-generation/generate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer test-token" \\
  -d '${JSON.stringify(testLoraRequest)}'`;

console.log('Testing LoRA endpoint with new parameters...');
console.log('Request payload:', JSON.stringify(testLoraRequest, null, 2));
console.log('\nCurl command:');
console.log(curlCommand);

exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  
  console.log('\n--- Response ---');
  console.log(stdout);
  
  if (stderr) {
    console.log('\n--- Error ---');
    console.log(stderr);
  }
});
