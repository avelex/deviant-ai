import { execSync } from 'child_process';
const input = `
@import "tailwindcss";
@custom-variant dark (&:is(.dark *));
@custom-variant darkx (&:where(.dark, .dark *));
`;
const fs = require('fs');
fs.writeFileSync('test-input.css', input);

try {
  execSync('npx @tailwindcss/cli -i test-input.css -o test-output.css', { stdio: 'inherit' });
  const output = fs.readFileSync('test-output.css', 'utf-8');
  console.log(output.includes('.dark'));
} catch(e) {
  console.log('Error', e.message);
}
