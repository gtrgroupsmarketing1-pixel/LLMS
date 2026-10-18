/**
 * A lightweight load testing script.
 * In a real environment, this would use k6 or autocannon.
 * This is a pure Node script using built-in fetch to simulate traffic.
 * 
 * Usage: tsx load-test.ts <url> <concurrency> <durationSeconds>
 */

const targetUrl = process.argv[2];
const concurrency = parseInt(process.argv[3] || '10', 10);
const duration = parseInt(process.argv[4] || '5', 10);

if (!targetUrl) {
  console.error('Usage: tsx load-test.ts <url> [concurrency] [durationSeconds]');
  process.exit(1);
}

async function runWorker(workerId: number, stopTime: number) {
  let requests = 0;
  let errors = 0;
  const latencies: number[] = [];

  while (Date.now() < stopTime) {
    const start = Date.now();
    try {
      const res = await fetch(targetUrl, {
        headers: { 'x-load-test-worker': String(workerId) },
      });
      if (!res.ok && res.status !== 401) { // Ignore 401s for unauth endpoints
        errors++;
      }
    } catch {
      errors++;
    }
    latencies.push(Date.now() - start);
    requests++;
  }
  return { requests, errors, latencies };
}

async function main() {
  console.log(`Starting load test: ${concurrency} workers for ${duration}s against ${targetUrl}`);
  const stopTime = Date.now() + duration * 1000;
  
  const promises = Array.from({ length: concurrency }).map((_, i) => runWorker(i, stopTime));
  const results = await Promise.all(promises);

  let totalReqs = 0;
  let totalErrors = 0;
  let allLatencies: number[] = [];

  for (const r of results) {
    totalReqs += r.requests;
    totalErrors += r.errors;
    allLatencies = allLatencies.concat(r.latencies);
  }

  allLatencies.sort((a, b) => a - b);
  
  const p50 = allLatencies[Math.floor(allLatencies.length * 0.5)] || 0;
  const p95 = allLatencies[Math.floor(allLatencies.length * 0.95)] || 0;
  const p99 = allLatencies[Math.floor(allLatencies.length * 0.99)] || 0;
  const rps = Math.round(totalReqs / duration);

  console.log('\n--- Results ---');
  console.log(`Total Requests: ${totalReqs}`);
  console.log(`Errors:         ${totalErrors}`);
  console.log(`RPS:            ${rps}`);
  console.log(`P50 Latency:    ${p50}ms`);
  console.log(`P95 Latency:    ${p95}ms`);
  console.log(`P99 Latency:    ${p99}ms`);
}

main().catch(console.error);
