const fs = require('node:fs');
const path = require('node:path');

const apiUrl = process.env.GRAPHQL_API_URL;
const requireEnv = process.argv.includes('--require-env');

if (requireEnv && !apiUrl) {
  console.error('GRAPHQL_API_URL must be set for a Vercel production build.');
  process.exit(1);
}

const graphqlApiUrl = apiUrl || 'http://localhost:4000';
const configPath = path.join(__dirname, '..', 'public', 'runtime-config.js');
const config = `globalThis.__POKI_CONFIG__ = ${JSON.stringify({ graphqlApiUrl })};\n`;

fs.writeFileSync(configPath, config);
console.log(`Frontend GraphQL endpoint configured as ${graphqlApiUrl}`);
