# 🚀 Supabase Setup Guide - School Examination Portal

**Project ID:** `qhhqygidoqbnqhhggunu`
**Status:** Ready for Implementation

---

## 📋 QUICK SETUP (RECOMMENDED)

### Step 1: Go to Your Supabase Dashboard
1. Open: https://supabase.com/dashboard
2. Select your project: **qhhqygidoqbnqhhggunu**

### Step 2: Open SQL Editor
1. In the left sidebar, click on **"SQL Editor"**
2. Click **"+ New query"**

### Step 3: Run the Complete Setup Script
1. Copy the entire contents of the file: `supabase/setup_complete_database.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** (or press Ctrl+Enter)

### Step 4: Verify Setup
After running the script, you should see these tables in the **Table Editor**:
- ✅ `teachers`
- ✅ `students`
- ✅ `exams`
- ✅ `grade_criteria`
- ✅ `grades`

---

## 🔧 DETAILED SETUP OPTIONS

### Option 1: Manual SQL Execution (Recommended)

1. **Open Supabase Dashboard**: https://qhhqygidoqbnqhhggunu.supabase.co
2. **Navigate to SQL Editor**
3. **Copy & Paste** the entire content of `supabase/setup_complete_database.sql`
4. **Click "Run"**

### Option 2: Command Line Setup

```bash
# Install dependencies (if not already done)
npm install @supabase/supabase-js

# Run the setup script (requires Node.js)
node scripts/setup_database.js
```

---

## 📊 WHAT WILL BE CREATED

### Tables Created
| Table | Purpose | Sample Data |
|-------|---------|-------------|
| `teachers` | Teacher accounts | 3 teachers (T001-T003) |
| `students` | Student records | 5 students (11111-55555) |
| `exams` | Exam schedules | 3 sample exams |
| `grade_criteria` | Grading rules | 3 criteria (tasleem, not2, ada2_gama3y) |
| `grades` | Student grades | Sample grades for testing |

### Views Created
- `grade_aggregates` - Student performance statistics
- `teacher_performance` - Teacher grading statistics

### Functions Created
- `get_student_grades_summary(student_code)` - Get all grades for a student
- `get_teacher_stats(teacher_id)` - Get teacher statistics

### Security Features
- Row Level Security (RLS) enabled on all tables
- Teacher access policies
- Indexes for performance optimization

---

## 🔐 DEFAULT LOGIN CREDENTIALS

### Teacher Accounts
| ID | Name | Password |
|----|------|----------|
| T001 | Mr. Andrew | `password123` |
| T002 | Mr. Antoon | `password123` |
| T003 | Mr. Mina | `password123` |

### Student Codes
- 11111 - أحمد محمد علي (Level 5, Class 5أ)
- 22222 - فاطمة حسن إبراهيم (Level 5, Class 5ب)
- 33333 - محمد عبدالله خالد (Level 3, Class 3ج)
- 44444 - نورة سالم أحمد (Level 4, Class 4أ)
- 55555 - عمر علي حسن (Level 6, Class 6ب)

---

## ✅ VERIFICATION CHECKLIST

### After Setup, Verify:

#### 1. Tables Created
- [ ] Go to **Table Editor** in Supabase
- [ ] Check all 5 tables exist: `teachers`, `students`, `exams`, `grade_criteria`, `grades`

#### 2. Sample Data Inserted
- [ ] `teachers` table has 3 records
- [ ] `students` table has 5 records
- [ ] `exams` table has 3 records
- [ ] `grade_criteria` table has 3 records
- [ ] `grades` table has sample data

#### 3. Application Connection
- [ ] Test teacher login with T001/password123
- [ ] Search for student code "11111"
- [ ] Verify grading interface works

#### 4. Test Sample Queries
Run these in SQL Editor to verify:

```sql
-- Test teacher data
SELECT * FROM teachers;

-- Test student data
SELECT * FROM students WHERE code = '11111';

-- Test grade data
SELECT * FROM grades LIMIT 5;

-- Test teacher stats function
SELECT * FROM get_teacher_stats('T001');

-- Test student grades function
SELECT * FROM get_student_grades_summary('11111');
```

---

## 🚨 TROUBLESHOOTING

### Common Issues & Solutions

#### Issue 1: "Permission Denied" Errors
**Solution:** Make sure you're using the Service Role Key for setup, not the Anon Key.

#### Issue 2: Tables Not Visible
**Solution:** Refresh the page and check the Table Editor. Tables might appear after a few seconds.

#### Issue 3: RLS Policy Errors
**Solution:** The setup script includes RLS policies. If you get errors, disable RLS temporarily:
```sql
ALTER TABLE grades DISABLE ROW LEVEL SECURITY;
-- Then re-enable after testing
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
```

#### Issue 4: Duplicate Key Errors
**Solution:** Run the cleanup script first (included at the top of the setup file).

#### Issue 5: Connection Timeout
**Solution:** The script might take a few minutes. Split it into smaller parts if needed.

---

## 🔧 CONFIGURATION CHECK

### Environment Variables
Your `.env` file should contain:
```env
VITE_SUPABASE_PROJECT_ID="qhhqygidoqbnqhhggunu"
VITE_SUPABASE_URL="https://qhhqygidoqbnqhhggunu.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Supabase Client Configuration
The application is already configured to use your project:
- ✅ URL: `https://qhhqygidoqbnqhhggunu.supabase.co`
- ✅ Anon Key: Set in environment variables
- ✅ Service Role Key: Available for admin operations

---

## 📱 TESTING THE SETUP

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Teacher Login
1. Go to http://localhost:5173/teacher
2. Login with: `T001` / `password123`
3. Should see teacher dashboard

### 3. Test Student Search
1. In dashboard, search for student code: `11111`
2. Should find "أحمد محمد علي"
3. Add to grading batch

### 4. Test Grading
1. Enter grades for the student
2. Click "Save"
3. Should see success message

---

## 🔄 DATA MIGRATION (Optional)

If you have existing data in localStorage and want to migrate:

1. **Export from localStorage** (in browser console):
```javascript
const grades = JSON.parse(localStorage.getItem('school_exam_grades') || '{}');
console.log(JSON.stringify(grades, null, 2));
```

2. **Import to Supabase** using the service layer functions

---

## 📞 SUPPORT

### If You Need Help:

1. **Check Supabase Logs**: In your project dashboard
2. **Run Verification Queries**: See verification section above
3. **Check Network Tab**: In browser dev tools for API calls
4. **Review Environment Variables**: Ensure they match your project

### Quick Debug Commands:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('teachers', 'students', 'exams', 'grade_criteria', 'grades');

-- Check row counts
SELECT 'teachers' as table_name, COUNT(*) as count FROM teachers
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'exams', COUNT(*) FROM exams
UNION ALL
SELECT 'grade_criteria', COUNT(*) FROM grade_criteria
UNION ALL
SELECT 'grades', COUNT(*) FROM grades;
```

---

## 🎉 NEXT STEPS

After setup is complete:

1. ✅ **Test basic functionality** with sample data
2. ✅ **Verify all features work** (login, search, grading)
3. ✅ **Check mobile responsiveness**
4. ✅ **Proceed to Phase 4** (Admin features)

Your School Examination Portal is now ready for production use! 🚀