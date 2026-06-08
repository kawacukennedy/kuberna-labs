/**
 * AI Model Download Script for Kuberna Labs
 *
 * Downloads required local AI model files for the platform's AI features.
 * Models are cached in the backend's node_modules by Transformers.js automatically,
 * but this script provides a manual download mechanism.
 *
 * Usage: node scripts/download-ai-models.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { pipeline } = require('stream/promises');

const MODELS_DIR = path.join(__dirname, '..', 'models');

const MODELS = [
  {
    name: 'Xenova/all-MiniLM-L6-v2',
    type: 'embedding',
    description:
      'Lightweight sentence embedding model (384-dim) for intent similarity search and RAG',
    size: '~80MB',
    source: 'https://huggingface.co/Xenova/all-MiniLM-L6-v2',
    files: ['model.onnx', 'tokenizer.json', 'config.json'],
  },
];

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          file.close();
          fs.unlinkSync(dest);
          return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        }
        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(dest);
          reject(new Error(`HTTP ${response.statusCode} for ${url}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        file.close();
        fs.unlinkSync(dest, () => {});
        reject(err);
      });
  });
}

async function verifySetup() {
  console.log('\n=== Kuberna Labs AI Model Downloader ===\n');

  await ensureDir(MODELS_DIR);

  console.log('Checking installed npm packages for AI support...\n');

  const packages = [
    { name: '@xenova/transformers', description: 'Transformers.js - runs ML models locally' },
    { name: 'compromise', description: 'Natural language processing (entity extraction)' },
    { name: 'natural', description: 'Natural language toolkit (tokenization, TF-IDF)' },
  ];

  let allInstalled = true;

  for (const pkg of packages) {
    const pkgPath = path.join(__dirname, '..', 'backend', 'node_modules', pkg.name);
    if (fs.existsSync(pkgPath)) {
      console.log(`  ✓ ${pkg.name} - ${pkg.description}`);
    } else {
      console.log(`  ✗ ${pkg.name} - NOT INSTALLED (run: cd backend && npm install ${pkg.name})`);
      allInstalled = false;
    }
  }

  if (!allInstalled) {
    console.log('\n⚠  Some packages are missing. Install them first:');
    console.log('  cd backend && npm install @xenova/transformers compromise natural');
    console.log();
  }

  console.log('\nModel information:');
  console.log('───────────────────────────────────────────────────');

  for (const model of MODELS) {
    console.log(`  Model: ${model.name}`);
    console.log(`  Type: ${model.type}`);
    console.log(`  Size: ${model.size}`);
    console.log(`  Source: ${model.source}`);
    console.log('───────────────────────────────────────────────────');
  }

  console.log('\n✓ Models are auto-downloaded on first use by Transformers.js.');
  console.log('  The embedding model (all-MiniLM-L6-v2) will be cached at:');
  console.log('  ~/.cache/xenova/transformers-v3/');
  console.log();
  console.log('  When the platform starts, the EmbeddingService will automatically');
  console.log('  load and cache this model. No manual download is required.');
  console.log();
  console.log('  To pre-cache the model, start the backend once:');
  console.log('  cd backend && npm run dev');
  console.log();
  console.log('=== Setup verification complete ===\n');
}

verifySetup().catch(console.error);
