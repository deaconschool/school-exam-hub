# 🔐 Admin Management Guide

## 📋 Overview

This guide provides secure methods for managing admin and super_admin accounts in your School Exam Hub system. All operations use proper bcrypt password hashing and secure database operations.

## 🛠️ Management Tools

### 1. Command Line Tool (Recommended)
Use the `admin-manager.js` script for automated admin management:

```bash
# Create new admin
node scripts/admin-manager.js create <username> <email> <password> [role] [permissions...]

# Update existing admin
node scripts/admin-manager.js update <username_or_email> <field=value>...

# Delete admin
node scripts/admin-manager.js delete <username_or_email>

# List all admins
node scripts/admin-manager.js list

# Generate password hash for manual SQL
node scripts/admin-manager.js hash <password>
```

### 2. Direct SQL Operations
For manual database operations through Supabase SQL Editor.

## 👥 Admin Roles & Permissions

### Roles
- **`admin`**: Limited permissions for specific management tasks
- **`super_admin`**: Full system access with all permissions

### Available Permissions
- **`manage_teachers`**: Create, edit, delete teachers
- **`manage_students`**: Manage student data and classes
- **`manage_exams`**: Create and manage exams and grades
- **`manage_system`**: Full system configuration and settings

## 🚀 Quick Start Examples

### Create New Admin Accounts

```bash
# Create teacher manager
node scripts/admin-manager.js create teacher1 teacher1@school.com TeachPass123 admin manage_teachers manage_students

# Create super admin with full access
node scripts/admin-manager.js create director director@school.com DirPass2024 super_admin manage_teachers,manage_students,manage_exams,manage_system
```

### Update Admin Accounts

```bash
# Change password
node scripts/admin-manager.js update teacher1 password=NewSecurePass456

# Promote to super admin
node scripts/admin-manager.js update teacher1 role=super_admin permissions=manage_teachers,manage_students,manage_exams,manage_system

# Change email
node scripts/admin-manager.js update teacher1 email=newemail@school.com

# Deactivate admin
node scripts/admin-manager.js update teacher1 is_active=false
```

### Delete Admin Accounts

```bash
# Delete admin by username
node scripts/admin-manager.js delete teacher1

# Delete admin by email
node scripts/admin-manager.js delete teacher1@school.com
```

## 📊 List Current Admins

```bash
# Show all admin accounts
node scripts/admin-manager.js list
```

**Sample Output:**
```
📋 Admin Users:
────────────────────────────────────────────────────────────────────────────────────────────────────
Username         Email                     Role        Active  Last Login           Permissions
────────────────────────────────────────────────────────────────────────────────────────────────────
admin            admin@schoolexamportal.com super_admin  true    2025-11-26        manage_teachers,manage_students,manage_exams,manage_system
youssef          youssef@admin.com         super_admin  true    Never              manage_teachers,manage_students,manage_exams,manage_system
────────────────────────────────────────────────────────────────────────────────────────────────────

Total: 2 admin(s)
```

## 🔑 Password Hash Generation

For manual SQL operations, generate secure password hashes:

```bash
# Generate hash for manual use
node scripts/admin-manager.js hash YourSecurePassword123
```

**Sample Output:**
```
🔐 Password Hash Generated:
──────────────────────────────────────────────────
Password: YourSecurePassword123
Hash: $2b$12$AbCdEfGhIjKlMnOpQrStUvWxYz1234567890...
SQL: password_hash = '$2b$12$AbCdEfGhIjKlMnOpQrStUvWxYz1234567890...'
──────────────────────────────────────────────────
```

## 🔧 Manual SQL Operations

### Create Admin via SQL

```sql
INSERT INTO admin_users (username, email, password_hash, role, permissions, is_active)
VALUES (
  'newadmin',
  'newadmin@school.com',
  '$2b$12$[generated_bcrypt_hash]',
  'admin',
  ARRAY['manage_teachers', 'manage_students'],
  true
);
```

### Update Admin via SQL

```sql
-- Update password
UPDATE admin_users
SET password_hash = '$2b$12$[new_bcrypt_hash]'
WHERE username = 'admin';

-- Update role and permissions
UPDATE admin_users
SET role = 'super_admin',
    permissions = ARRAY['manage_teachers', 'manage_students', 'manage_exams', 'manage_system']
WHERE username = 'admin';

-- Deactivate admin
UPDATE admin_users
SET is_active = false
WHERE username = 'admin';
```

### Delete Admin via SQL

```sql
DELETE FROM admin_users WHERE username = 'admin';
```

### List Admins via SQL

```sql
SELECT
  username,
  email,
  role,
  permissions,
  is_active,
  created_at,
  last_login
FROM admin_users
ORDER BY created_at DESC;
```

## 🔒 Security Best Practices

### Password Requirements
- Minimum 8 characters
- Include letters and numbers
- Use strong, unique passwords for each admin

### Recommended Roles
- **Super Admin**: Maximum 1-2 users
- **Regular Admin**: As needed for specific departments
- **Inactive Admins**: Deactivate instead of deleting for audit trail

### Access Control
```sql
-- Only super admins should have manage_system permission
UPDATE admin_users
SET permissions = ARRAY['manage_teachers', 'manage_students', 'manage_exams']
WHERE role = 'admin';
```

## 📝 Audit & Monitoring

### Check Admin Activity
```sql
-- Recently active admins
SELECT username, email, last_login
FROM admin_users
WHERE last_login IS NOT NULL
ORDER BY last_login DESC;

-- Inactive admins (no login for 30 days)
SELECT username, email, last_login
FROM admin_users
WHERE last_login < NOW() - INTERVAL '30 days'
OR last_login IS NULL;
```

### Backup Important Admin Accounts
Before making changes to super admin accounts:
```sql
-- Backup current super admins
SELECT * FROM admin_users
WHERE role = 'super_admin';
```

## 🚨 Emergency Procedures

### Reset Super Admin Password
```sql
-- Generate new hash using: node scripts/admin-manager.js hash NewSecurePassword
UPDATE admin_users
SET password_hash = '$2b$12$[new_hash]'
WHERE username = 'admin' AND role = 'super_admin';
```

### Disable All Admins (Emergency)
```sql
UPDATE admin_users SET is_active = false;
-- Then re-enable only trusted admins individually
UPDATE admin_users SET is_active = true WHERE username = 'admin';
```

## 🎯 Common Scenarios

### New School Year Setup
```bash
# Create academic admin
node scripts/admin-manager.js create academic2025 academic@school.com Acad2025! admin manage_students,manage_exams

# Deactivate old academic admin
node scripts/admin-manager.js update academic2024 is_active=false
```

### Teacher to Admin Promotion
```bash
# Create teacher admin
node scripts/admin-manager.js create teacher_admin teacher@school.com TeachAdmin123 admin manage_teachers
```

### Temporary Admin Access
```bash
# Create temporary admin
node scripts/admin-manager.js create temp_admin temp@school.com TempPass123 admin manage_students

# Remember to deactivate later
node scripts/admin-manager.js update temp_admin is_active=false
```

## 📞 Support

For issues with admin management:
1. Check the SQL error messages
2. Verify permissions and role assignments
3. Ensure password hashes are properly generated
4. Test with the command-line tool first before manual SQL

---

**⚠️ Important**: Always test admin account creation and login in a development environment before applying changes to production. Keep secure backups of admin credentials.