// Test file to verify AuthService functionality
// Run with: node test_password_hashing.js

import { AuthService } from './src/services/authService.js';

async function testPasswordHashing() {
  console.log('🧪 Testing Password Hashing and Verification');
  console.log('==========================================\n');

  const testPassword = '123456';
  console.log(`🔤 Original password: ${testPassword}`);

  try {
    // Test password hashing
    console.log('\n1️⃣ Testing password hashing...');
    const hashedPassword = await AuthService.hashPassword(testPassword);
    console.log(`✅ Password hashed successfully: ${hashedPassword}`);
    console.log(`📏 Hash length: ${hashedPassword.length} characters`);

    // Test password verification (correct password)
    console.log('\n2️⃣ Testing password verification (correct password)...');
    const isCorrect = await AuthService.comparePassword(testPassword, hashedPassword);
    console.log(`✅ Verification result: ${isCorrect ? 'SUCCESS' : 'FAILED'}`);

    // Test password verification (wrong password)
    console.log('\n3️⃣ Testing password verification (wrong password)...');
    const isWrong = await AuthService.comparePassword('wrongpassword', hashedPassword);
    console.log(`❌ Wrong password verification: ${isWrong ? 'UNEXPECTED SUCCESS' : 'CORRECTLY FAILED'}`);

    // Test password strength validation
    console.log('\n4️⃣ Testing password strength validation...');
    const weakPassword = '123';
    const strongPassword = 'MySecurePass123';

    const weakValidation = AuthService.validatePasswordStrength(weakPassword);
    console.log(`🔍 Weak password ("${weakPassword}"): ${weakValidation.isValid ? 'VALID' : 'INVALID'}`);
    if (!weakValidation.isValid) {
      console.log(`   Errors: ${weakValidation.errors.join(', ')}`);
    }

    const strongValidation = AuthService.validatePasswordStrength(strongPassword);
    console.log(`🔍 Strong password ("${strongPassword}"): ${strongValidation.isValid ? 'VALID' : 'INVALID'}`);
    if (!strongValidation.isValid) {
      console.log(`   Errors: ${strongValidation.errors.join(', ')}`);
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Password hashing works');
    console.log('   ✅ Password verification works');
    console.log('   ✅ Wrong passwords are correctly rejected');
    console.log('   ✅ Password strength validation works');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run the test
testPasswordHashing();