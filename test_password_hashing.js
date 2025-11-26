// Test file to verify AuthService functionality
// Run with: node test_password_hashing.js

import { AuthService } from './src/services/authService.js';

async function testPasswordHashing() {
  const testPassword = '123456';

  try {
    // Test password hashing
    const hashedPassword = await AuthService.hashPassword(testPassword);

    // Test password verification (correct password)
    const isCorrect = await AuthService.comparePassword(testPassword, hashedPassword);

    // Test password verification (wrong password)
    const isWrong = await AuthService.comparePassword('wrongpassword', hashedPassword);

    // Test password strength validation
    const weakPassword = '123';
    const strongPassword = 'MySecurePass123';

    const weakValidation = AuthService.validatePasswordStrength(weakPassword);
    if (!weakValidation.isValid) {
      // Weak password validation failed as expected
    }

    const strongValidation = AuthService.validatePasswordStrength(strongPassword);
    if (!strongValidation.isValid) {
      // Strong password validation result
    }

  } catch (error) {
    // Test failed with error
  }
}

// Run the test
testPasswordHashing();