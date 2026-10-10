import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testFiles = fs
  .readdirSync(__dirname)
  .filter((file) => file.endsWith('.test.ts'))
  .sort();

console.log(`\n🚀 Running Festify Test Suite (${testFiles.length} files found)...\n`);

let overallFailed = false;

for (const file of testFiles) {
  const filePath = path.join(__dirname, file);
  console.log(`==================================================`);
  console.log(`▶ Running: ${file}`);
  console.log(`==================================================`);
  try {
    execSync(`npx tsx "${filePath}"`, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../..'),
    });
    console.log(`\n✅ Suite passed: ${file}\n`);
  } catch (err) {
    console.error(`\n❌ Suite failed: ${file}\n`);
    overallFailed = true;
  }
}

if (overallFailed) {
  console.error(`\n❌ Test run failed: One or more test suites failed.\n`);
  process.exit(1);
} else {
  console.log(`\n🎉 All test suites passed successfully!\n`);
  process.exit(0);
}
