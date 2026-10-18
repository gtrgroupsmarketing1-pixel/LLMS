import fs from 'node:fs';
import path from 'node:path';

/**
 * Scans the repository for accidentally committed secrets.
 * Excludes node_modules, .git, .next, dist.
 */

const ROOT_DIR = path.resolve(__dirname, '../..');
const EXCLUDE_DIRS = ['node_modules', '.git', '.next', 'dist', '.turbo', 'pnpm-lock.yaml'];
const PATTERNS = [
  { name: 'Stripe Live Key', regex: /sk_live_[0-9a-zA-Z]{24,}/ },
  { name: 'Stripe Test Key', regex: /sk_test_[0-9a-zA-Z]{24,}/ },
  { name: 'AWS Access Key', regex: /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/ },
  { name: 'GitHub PAT', regex: /github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}/ },
  { name: 'Private Key', regex: /-----BEGIN PRIVATE KEY-----/ },
  { name: 'Generic Secret', regex: /(password|secret|token)\s*=\s*["'][^"']{8,}["']/i },
];

function walkDir(dir: string, callback: (filePath: string) => void) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (EXCLUDE_DIRS.includes(file)) continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.env') || file.endsWith('.yml') || file.endsWith('.yaml')) {
      callback(filePath);
    }
  }
}

async function run() {
  console.log('🔍 Scanning for exposed secrets...');
  let leaks = 0;

  walkDir(ROOT_DIR, (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of PATTERNS) {
        if (pattern.regex.test(line)) {
          // Ignore known safe placeholders
          if (line.includes('change-me') || line.includes('your-') || line.includes('mock-') || line.includes('example.com')) continue;
          if (pattern.name === 'Generic Secret' && (filePath.includes('.env.example') || filePath.includes('setup.ts'))) continue;
          
          console.error(`\x1b[31m[SECRET LEAK]\x1b[0m ${pattern.name} found in ${filePath} at line ${i + 1}`);
          leaks++;
        }
      }
    }
  });

  if (leaks > 0) {
    console.error(`\n❌ Found ${leaks} potential secret leaks.`);
    process.exit(1);
  } else {
    console.log('\n✅ No hardcoded secrets found.');
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
