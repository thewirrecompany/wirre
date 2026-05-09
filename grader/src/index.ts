import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { runGradingLoop } from './grader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STOP_FILE = path.resolve(__dirname, '..', '.stop');

const command = process.argv[2];

if (command === 'start') {
  startGrader();
} else if (command === 'stop') {
  stopGrader();
} else {
  console.log(`
╔══════════════════════════════════════════╗
║       WIRRE AI Grader CLI                ║
╠══════════════════════════════════════════╣
║  npm run grade:start   Start grading     ║
║  npm run grade:stop    Graceful stop     ║
╚══════════════════════════════════════════╝
  `);
  process.exit(0);
}

// ─── Start Command ──────────────────────────────────────────────────────────

function startGrader() {
  // Clean up any leftover stop file
  if (fs.existsSync(STOP_FILE)) fs.unlinkSync(STOP_FILE);

  console.log(`
╔══════════════════════════════════════════╗
║       WIRRE AI Grader                    ║
║       Model: ${config.deepinfraModel.padEnd(26)}║
║       Poll interval: ${(config.pollIntervalMs / 1000 + 's').padEnd(19)}║
╚══════════════════════════════════════════╝
  `);

  // Handle Ctrl+C gracefully
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Ctrl+C received. Stopping immediately...');
    
    // We need to dynamically import these to avoid circular dependencies if any
    const { getCurrentSubmissionId } = await import('./grader.js');
    const { resetToQueued } = await import('./queue.js');
    
    const currentId = getCurrentSubmissionId();
    if (currentId) {
      console.log('   Reverting current submission to queued status...');
      await resetToQueued(currentId);
      console.log('   Reverted successfully.');
    }
    
    if (fs.existsSync(STOP_FILE)) fs.unlinkSync(STOP_FILE);
    process.exit(0);
  });

  const shouldStop = () => fs.existsSync(STOP_FILE);

  runGradingLoop(shouldStop, config.pollIntervalMs)
    .then(() => {
      // Clean up stop file
      if (fs.existsSync(STOP_FILE)) fs.unlinkSync(STOP_FILE);
      process.exit(0);
    })
    .catch((err) => {
      console.error('💥 Fatal error:', err);
      if (fs.existsSync(STOP_FILE)) fs.unlinkSync(STOP_FILE);
      process.exit(1);
    });
}

// ─── Stop Command ───────────────────────────────────────────────────────────

function stopGrader() {
  if (fs.existsSync(STOP_FILE)) {
    console.log('⚠️  Stop already requested. The grader will exit after its current task.');
    return;
  }

  fs.writeFileSync(STOP_FILE, new Date().toISOString());
  console.log('🛑 Stop sentinel created. The grader will finish its current submission and exit.');
  console.log('   If no submission is being processed, it will exit on the next poll cycle.');
}
