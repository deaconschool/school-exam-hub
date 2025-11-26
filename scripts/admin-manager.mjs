#!/usr/bin/env node

import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = 'https://qhhqygidoqbnqhhggunu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaHF5Z2lkb3FibnFoaGdndW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNDM4MzIsImV4cCI6MjA3ODkxOTgzMn0.eW2iOx3_J_ipxFEeuyReg7Rr_hfHTHipQWDLV-dZ4wo';
const supabase = createClient(supabaseUrl, supabaseKey);

const SALT_ROUNDS = 12;

// Available permissions
const AVAILABLE_PERMISSIONS = [
  'manage_teachers',
  'manage_students',
  'manage_exams',
  'manage_system'
];

class AdminManager {
  async hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  async createAdmin(username, email, password, role = 'admin', permissions = ['manage_teachers', 'manage_students']) {
    try {
      // Validate inputs
      if (!username || !email || !password) {
        throw new Error('Username, email, and password are required');
      }

      if (!['admin', 'super_admin'].includes(role)) {
        throw new Error('Role must be "admin" or "super_admin"');
      }

      // Validate permissions
      const invalidPerms = permissions.filter(p => !AVAILABLE_PERMISSIONS.includes(p));
      if (invalidPerms.length > 0) {
        throw new Error(`Invalid permissions: ${invalidPerms.join(', ')}`);
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Insert admin user
      const { data, error } = await supabase
        .from('admin_users')
        .insert({
          username,
          email,
          password_hash: passwordHash,
          role,
          permissions,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        message: `Admin "${username}" created successfully!`,
        data
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async listAdmins() {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, username, email, role, permissions, is_active, created_at, last_login')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async generatePasswordHash(password) {
    try {
      const hash = await this.hashPassword(password);
      return {
        success: true,
        password,
        hash,
        sqlInsert: `password_hash = '${hash}'`
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// CLI Interface
async function main() {
  const action = process.argv[2];
  const manager = new AdminManager();

  switch (action) {
    case 'list':
      await handleList(manager);
      break;
    case 'hash':
      await handleHash(manager);
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

async function handleList(manager) {
  const result = await manager.listAdmins();

  if (result.success) {
    console.log('📋 Admin Users:');
    console.log('─'.repeat(100));
    console.log(`${'Username'.padEnd(15)} ${'Email'.padEnd(25)} ${'Role'.padEnd(12)} ${'Active'.padEnd(7)} ${'Last Login'.padEnd(20)} ${'Permissions'.padEnd(30)}`);
    console.log('─'.repeat(100));

    result.data.forEach(admin => {
      const lastLogin = admin.last_login ? new Date(admin.last_login).toLocaleDateString() : 'Never';
      const permissions = admin.permissions.join(', ');
      console.log(
        `${admin.username.padEnd(15)} ${admin.email.padEnd(25)} ${admin.role.padEnd(12)} ${admin.is_active.toString().padEnd(7)} ${lastLogin.padEnd(20)} ${permissions.padEnd(30)}`
      );
    });

    console.log(`\nTotal: ${result.data.length} admin(s)`);
  } else {
    console.log('❌', result.message);
  }
}

async function handleHash(manager) {
  const [,, action, password] = process.argv;

  if (!password) {
    console.log('❌ Usage: node scripts/admin-manager.mjs hash <password>');
    console.log('Example: node scripts/admin-manager.mjs hash mysecurepassword');
    return;
  }

  const result = await manager.generatePasswordHash(password);

  if (result.success) {
    console.log('🔐 Password Hash Generated:');
    console.log('─'.repeat(50));
    console.log(`Password: ${result.password}`);
    console.log(`Hash: ${result.hash}`);
    console.log(`SQL: ${result.sqlInsert}`);
    console.log('─'.repeat(50));
  } else {
    console.log('❌', result.message);
  }
}

function showHelp() {
  console.log('🛠️  Admin Management Tool');
  console.log('='.repeat(50));
  console.log('');
  console.log('Available Commands:');
  console.log('  list');
  console.log('    List all admin accounts');
  console.log('');
  console.log('  hash <password>');
  console.log('    Generate bcrypt hash for manual SQL insertion');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/admin-manager.mjs list');
  console.log('  node scripts/admin-manager.mjs hash mypassword');
  console.log('');
  console.log('For full admin management (create, update, delete):');
  console.log('Use the ADMIN_MANAGEMENT_GUIDE.md for manual SQL operations');
}

main().catch(console.error);