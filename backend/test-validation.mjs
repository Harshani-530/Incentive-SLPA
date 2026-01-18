import { validateUsername, checkUsernameExists } from './utils/usernameValidator.js';

// Test username validation
const testUsername = 'admin1';
const testPassword = 'pass123';

console.log('Testing username:', testUsername);
const result = validateUsername(testUsername, testPassword);
console.log('Validation result:', result);

// Test some other usernames
const tests = ['admin', 'test', 'user1', 'ab', 'a', 'Admin', '1user', 'user..', 'u_ser'];
tests.forEach(username => {
  const res = validateUsername(username, 'password');
  console.log(`"${username}":`, res.valid ? '✓ Valid' : `✗ ${res.error}`);
});
