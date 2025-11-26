# 🚀 Quick Admin Management Reference

## 🛠️ Tools Available

### 1. Command Line Tool
```bash
# List all admin accounts
node scripts/admin-manager.mjs list

# Generate password hash for manual SQL
node scripts/admin-manager.mjs hash <password>
```

### 2. Direct SQL (Supabase Editor)
Execute SQL directly in Supabase SQL Editor for full control.

## 📋 Current Admin Accounts

```sql
-- View all admins
SELECT username, email, role, is_active, last_login
FROM admin_users
ORDER BY created_at DESC;
```

## ➕ Create Admin Account

### Method 1: Direct SQL (Recommended)
```sql
INSERT INTO admin_users (username, email, password_hash, role, permissions, is_active)
VALUES (
  'newadmin',
  'newadmin@school.com',
  '$2b$12$[use_password_hash_tool_to_generate]',
  'admin',
  ARRAY['manage_teachers', 'manage_students'],
  true
);
```

### Method 2: Generate Password Hash First
```bash
# Generate hash
node scripts/admin-manager.mjs hash YourSecurePassword123

# Use the generated hash in SQL
```

## ✏️ Update Admin Account

```sql
-- Change password
UPDATE admin_users
SET password_hash = '$2b$12$[new_hash]'
WHERE username = 'admin';

-- Change role
UPDATE admin_users
SET role = 'super_admin',
    permissions = ARRAY['manage_teachers', 'manage_students', 'manage_exams', 'manage_system']
WHERE username = 'admin';

-- Deactivate admin
UPDATE admin_users
SET is_active = false
WHERE username = 'admin';
```

## ❌ Delete Admin Account

```sql
DELETE FROM admin_users WHERE username = 'admin';
```

## 🔑 Password Hash Generation

```bash
# Generate hash for any password
node scripts/admin-manager.mjs hash MySecurePassword123

# Output example:
# Hash: $2b$12$random_hash_here
# SQL: password_hash = '$2b$12$random_hash_here'
```

## 👥 Available Roles & Permissions

### Roles
- `admin` - Limited permissions
- `super_admin` - Full system access

### Permissions
- `manage_teachers` - Teacher management
- `manage_students` - Student management
- `manage_exams` - Exam and grade management
- `manage_system` - System configuration

## 🎯 Common Examples

### Create Teacher Admin
```sql
INSERT INTO admin_users (username, email, password_hash, role, permissions, is_active)
VALUES (
  'teacher_admin',
  'teacher@school.com',
  '$2b$12$[generated_hash]',
  'admin',
  ARRAY['manage_teachers', 'manage_students'],
  true
);
```

### Create Super Admin
```sql
INSERT INTO admin_users (username, email, password_hash, role, permissions, is_active)
VALUES (
  'director',
  'director@school.com',
  '$2b$12$[generated_hash]',
  'super_admin',
  ARRAY['manage_teachers', 'manage_students', 'manage_exams', 'manage_system'],
  true
);
```

## 🔒 Security Tips

1. **Always use bcrypt hashes** - Never store plain text passwords
2. **Limit super admins** - Maximum 1-2 super admin accounts
3. **Use strong passwords** - Minimum 8 characters with letters and numbers
4. **Deactivate instead of delete** - Keep audit trail
5. **Test login** - Verify new admin can log in after creation

## 🚨 Emergency Commands

### Reset Super Admin Password
```sql
-- Generate new hash first, then:
UPDATE admin_users
SET password_hash = '$2b$12$[new_emergency_hash]'
WHERE username = 'admin' AND role = 'super_admin';
```

### Disable All Admins (Emergency Only)
```sql
UPDATE admin_users SET is_active = false;
-- Then re-enable only trusted admins:
UPDATE admin_users SET is_active = true WHERE username = 'trusted_admin';
```

## 📞 Quick Test

After creating or updating admin accounts:

1. **List admins**: `node scripts/admin-manager.mjs list`
2. **Test login**: Go to your application and try logging in
3. **Verify permissions**: Check admin dashboard access

---

**📚 For detailed instructions**: See `ADMIN_MANAGEMENT_GUIDE.md`