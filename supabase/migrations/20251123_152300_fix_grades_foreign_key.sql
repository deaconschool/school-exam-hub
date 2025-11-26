-- Fix grades table foreign key constraint to reference hymns_exams instead of exams
-- This allows the teacher portal to save grades with hymns_exams UUIDs

-- First, drop the existing foreign key constraint
ALTER TABLE grades DROP CONSTRAINT IF EXISTS grades_exam_id_fkey;

-- Add the new foreign key constraint to reference hymns_exams
ALTER TABLE grades
ADD CONSTRAINT grades_hymns_exam_id_fkey
FOREIGN KEY (exam_id) REFERENCES hymns_exams(id) ON DELETE CASCADE;

-- Add comment to clarify the change
COMMENT ON TABLE grades IS 'Student grades with foreign key to hymns_exams table for dynamic grading criteria';