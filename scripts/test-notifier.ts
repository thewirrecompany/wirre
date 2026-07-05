import { sendCompletionEmails } from '../grader/src/notifier.js';

async function run() {
  await sendCompletionEmails([{
    email: 'aryamirani06@gmail.com',
    name: 'Arya Mirani',
    registrationId: 'test-123'
  }]);
  console.log('Test done');
  process.exit(0);
}

run();
