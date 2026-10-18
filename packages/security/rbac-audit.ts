import fs from 'node:fs';
import path from 'node:path';

/**
 * Static analysis script to ensure every API route is protected.
 * It scans the route files for router.method() calls and checks if they
 * are preceded by an auth middleware (requireAuth, requireClient).
 * 
 * Public routes MUST contain a comment: // @public
 */

const ROUTES_DIR = path.resolve(__dirname, '../../apps/api/src/routes');

function walkDir(dir: string, callback: (filePath: string) => void) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (file.endsWith('.ts')) {
      callback(filePath);
    }
  }
}

async function run() {
  console.log('🔍 Auditing RBAC on API routes...');
  let issues = 0;

  walkDir(ROUTES_DIR, (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let currentRouteContext = '';
    let inRouteBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('router.get(') || line.includes('router.post(') || line.includes('router.patch(') || line.includes('router.put(') || line.includes('router.delete(')) {
        inRouteBlock = true;
        currentRouteContext = line;
        
        // Look ahead in the same block for auth
        let hasAuth = false;
        let hasPublic = false;
        let j = i;
        while (j < lines.length && j < i + 15) {
          if (lines[j].includes('requireAuth') || lines[j].includes('requireClient') || lines[j].includes('requireAgency')) hasAuth = true;
          if (lines[j].includes('// @public')) hasPublic = true;
          if (lines[j].includes(');') && j > i) break; // end of middleware chain
          j++;
        }

        if (!hasAuth && !hasPublic) {
          // Check if the route is in a public router (like website public routes)
          const fileName = path.basename(filePath);
          if (fileName === 'website.routes.ts' && currentRouteContext.includes('/public/')) {
             // ignore website public routes, they are intentionally public
          } else if (fileName === 'opt-out.routes.ts' || fileName === 'compliance.routes.ts' && currentRouteContext.includes('webhook')) {
             // ignore webhooks
          } else {
            console.error(`\x1b[31m[RBAC ERROR]\x1b[0m Missing auth in ${fileName} at line ${i + 1}: ${line.trim()}`);
            issues++;
          }
        }
        inRouteBlock = false;
      }
    }
  });

  if (issues > 0) {
    console.error(`\n❌ Found ${issues} unprotected routes.`);
    process.exit(1);
  } else {
    console.log('\n✅ All routes are protected or marked @public.');
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
