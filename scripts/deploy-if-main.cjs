#!/usr/bin/env node
const { execSync } = require('child_process');
const { exit } = require('process');

try {
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  if (branch !== 'main') {
    console.error(`Deploy aborted: current branch is '${branch}'. Deploy is allowed only from 'main'.`);
    exit(1);
  }

  console.log('On main branch — running gh-pages publish');
  execSync('npx gh-pages -d dist', { stdio: 'inherit' });
} catch (err) {
  console.error('Deploy failed:', err.message || err);
  exit(1);
}
