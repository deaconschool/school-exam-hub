-- Fix missing RLS policies for students table
-- This file adds the missing UPDATE and INSERT policies for students

-- Note: These policies assume the application uses service role keys for admin operations
-- If using a different authentication system, adjust the conditions accordingly

-- Allow service role (used by admin functions) to perform all operations on students
CREATE POLICY "Service role can perform all operations on students" ON students
FOR ALL
USING (auth.role() = 'service_role');

-- Alternative approach for regular users (if not using service role):
-- Allow authenticated users to update students
-- CREATE POLICY "Authenticated users can update students" ON students
-- FOR UPDATE
-- USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'user_type' = 'admin');

-- Allow authenticated users to insert students
-- CREATE POLICY "Authenticated users can insert students" ON students
-- FOR INSERT
-- WITH CHECK (auth.role() = 'authenticated' AND auth.jwt() ->> 'user_type' = 'admin');

-- Allow service role to select all students (redundant but explicit)
CREATE POLICY "Service role can select all students" ON students
FOR SELECT
USING (auth.role() = 'service_role');