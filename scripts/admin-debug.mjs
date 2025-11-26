#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Configuration
const supabaseUrl = 'https://qhhqygidoqbnqhhggunu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaHF5Z2lkb3FibnFoaGdndW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNDM4MzIsImV4cCI6MjA3ODkxOTgzMn0.eW2iOx3_J_ipxFEeuyReg7Rr_hfHTHipQWDLV-dZ4wo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAdminAuth() {
  console.log('🔍 Admin Authentication Debug Tool');
  console.log('='.repeat(50));

  try {
    // Test database connection
    console.log('1. Testing database connection...');
    const { data, error } = await supabase
      .from('admin_users')
      .select('count')
      .single();

    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return;
    } else {
      console.log('✅ Database connection successful');
    }

    // List all admin accounts
    console.log('\n2. Listing all admin accounts...');
    const { data: admins, error: adminError } = await supabase
      .from('admin_users')
      .select('username, email, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (adminError) {
      console.log('❌ Failed to fetch admins:', adminError.message);
    } else {
      console.log('✅ Admin accounts found:');
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.username} (${admin.role}) - ${admin.is_active ? 'Active' : 'Inactive'} - ${admin.email}`);
      });
    }

    // Test specific admin authentication
    if (process.argv.length >= 4) {
      const testUsername = process.argv[2];
      const testPassword = process.argv[3];

      console.log(`\n3. Testing authentication for "${testUsername}"...`);

      // Get admin from database
      const { data: adminData, error: fetchError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', testUsername)
        .eq('is_active', true)
        .single();

      if (fetchError) {
        console.log('❌ Admin not found or inactive:', fetchError.message);
      } else {
        console.log(`✅ Admin found: ${adminData.username} (${adminData.role})`);

        // Test password verification
        console.log('4. Testing password verification...');

        try {
          const isPasswordValid = await bcrypt.compare(testPassword, adminData.password_hash);

          if (isPasswordValid) {
            console.log('✅ Password verification successful');
            console.log('🎉 Authentication would succeed!');
          } else {
            console.log('❌ Password verification failed');
            console.log('💡 Check if the password is correct');
          }
        } catch (bcryptError) {
          console.log('❌ Password verification error:', bcryptError.message);
        }

        // Show password hash info
        console.log('\n5. Password hash information:');
        console.log(`   Hash: ${adminData.password_hash.substring(0, 20)}...`);
        console.log(`   Hash length: ${adminData.password_hash.length}`);
        console.log(`   Hash format: ${adminData.password_hash.startsWith('$2b$') ? '✅ bcrypt' : '❌ Not bcrypt'}`);
      }
    } else {
      console.log('\n💡 To test specific admin authentication:');
      console.log('   node scripts/admin-debug.mjs <username> <password>');
      console.log('   Example: node scripts/admin-debug.mjs admin admin123');
    }

    // Check RLS policies
    console.log('\n6. Checking RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'admin_users' });

    if (policyError) {
      console.log('⚠️  Could not check RLS policies (this is normal)');
    } else {
      console.log('✅ RLS policies accessible');
    }

  } catch (error) {
    console.log('❌ Debug error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Debug complete');
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('🔍 Admin Authentication Debug Tool');
  console.log('='.repeat(50));
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/admin-debug.mjs                    # General debug info');
  console.log('  node scripts/admin-debug.mjs <username> <password>  # Test specific admin');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/admin-debug.mjs admin admin123');
  console.log('  node scripts/admin-debug.mjs youssef admin782004');
  console.log('');
  process.exit(0);
}

debugAdminAuth().catch(console.error);