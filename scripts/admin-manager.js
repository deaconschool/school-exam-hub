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

  async updateAdmin(identifier, updates) {
    try {
      let query = supabase
        .from('admin_users');

      // Find admin by username or email
      const { data: existingAdmin } = await supabase
        .from('admin_users')
        .select('*')
        .or(`username.eq.${identifier},email.eq.${identifier}`)
        .single();

      if (!existingAdmin) {
        throw new Error('Admin not found');
      }

      // Process updates
      const updateData = { ...updates };

      // Handle password update
      if (updates.password) {
        updateData.password_hash = await this.hashPassword(updates.password);
        delete updateData.password; // Remove plain text password
      }

      // Validate role if provided
      if (updates.role && !['admin', 'super_admin'].includes(updates.role)) {
        throw new Error('Role must be "admin" or "super_admin"');
      }

      // Validate permissions if provided
      if (updates.permissions) {
        const invalidPerms = updates.permissions.filter(p => !AVAILABLE_PERMISSIONS.includes(p));
        if (invalidPerms.length > 0) {
          throw new Error(`Invalid permissions: ${invalidPerms.join(', ')}`);
        }
      }

      const { data, error } = await supabase
        .from('admin_users')
        .update(updateData)
        .eq('id', existingAdmin.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        message: `Admin "${existingAdmin.username}" updated successfully!`,
        data
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async deleteAdmin(identifier) {
    try {
      // Find admin by username or email
      const { data: existingAdmin } = await supabase
        .from('admin_users')
        .select('*')
        .or(`username.eq.${identifier},email.eq.${identifier}`)
        .single();

      if (!existingAdmin) {
        throw new Error('Admin not found');
      }

      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', existingAdmin.id);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        success: true,
        message: `Admin "${existingAdmin.username}" deleted successfully!`
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
    case 'create':
      await handleCreate(manager);
      break;
    case 'update':
      await handleUpdate(manager);
      break;
    case 'delete':
      await handleDelete(manager);
      break;
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

async function handleCreate(manager) {
  const [,, action, username, email, password, role = 'admin', ...permissions] = process.argv;

  if (!username || !email || !password) {
    console.log('❌ Usage: node admin-manager.js create <username> <email> <password> [role] [permissions...]');
    console.log('Example: node admin-manager.js create john john@school.com mypassword admin manage_teachers manage_students');
    return;
  }

  const perms = permissions.length > 0 ? permissions : ['manage_teachers', 'manage_students'];
  const result = await manager.createAdmin(username, email, password, role, perms);

  if (result.success) {
    console.log('✅', result.message);
  } else {
    console.log('❌', result.message);
  }
}

async function handleUpdate(manager) {
  const [,, action, identifier, ...updateArgs] = process.argv;

  if (!identifier || updateArgs.length === 0) {
    console.log('❌ Usage: node admin-manager.js update <username_or_email> <field=value>...');
    console.log('Examples:');
    console.log('  node admin-manager.js update john password=newpass');
    console.log('  node admin-manager.js update john role=super_admin');
    console.log('  node admin-manager.js update john email=newemail@school.com');
    console.log('  node admin-manager.js update john permissions=manage_teachers,manage_students,manage_exams');
    console.log('  node admin-manager.js update john is_active=false');
    return;
  }

  const updates = {};
  updateArgs.forEach(arg => {
    const [key, value] = arg.split('=');
    if (key === 'permissions') {
      updates[key] = value.split(',');
    } else if (key === 'is_active') {
      updates[key] = value === 'true';
    } else {
      updates[key] = value;
    }
  });

  const result = await manager.updateAdmin(identifier, updates);

  if (result.success) {
    console.log('✅', result.message);
  } else {
    console.log('❌', result.message);
  }
}

async function handleDelete(manager) {
  const [,, action, identifier] = process.argv;

  if (!identifier) {
    console.log('❌ Usage: node admin-manager.js delete <username_or_email>');
    console.log('Example: node admin-manager.js delete john');
    return;
  }

  const result = await manager.deleteAdmin(identifier);

  if (result.success) {
    console.log('✅', result.message);
  } else {
    console.log('❌', result.message);
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
    console.log('❌ Usage: node admin-manager.js hash <password>');
    console.log('Example: node admin-manager.js hash mysecurepassword');
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
  console.log('Commands:');
  console.log('  create <username> <email> <password> [role] [permissions...]');
  console.log('    Create a new admin account');
  console.log('');
  console.log('  update <identifier> <field=value>...');
  console.log('    Update admin account (identifier can be username or email)');
  console.log('');
  console.log('  delete <identifier>');
  console.log('    Delete admin account');
  console.log('');
  console.log('  list');
  console.log('    List all admin accounts');
  console.log('');
  console.log('  hash <password>');
  console.log('    Generate bcrypt hash for manual SQL insertion');
  console.log('');
  console.log('Examples:');
  console.log('  node admin-manager.js create principal principal@school.com mypass super_admin manage_teachers,manage_students,manage_exams,manage_system');
  console.log('  node admin-manager.js update john password=newpass role=super_admin');
  console.log('  node admin-manager.js delete john');
  console.log('  node admin-manager.js list');
  console.log('  node admin-manager.js hash mypassword');
  console.log('');
  console.log('Available Permissions:');
  console.log('  manage_teachers, manage_students, manage_exams, manage_system');
  console.log('');
  console.log('Roles:');
  console.log('  admin, super_admin');
}

if (require.main === module) {
  main().catch(console.error);
}

export default AdminManager;