-- Migration: Replace exam_date with exam_month and exam_year fields
-- This changes the exam structure from a single date field to separate month/year fields
-- since exams occur monthly

-- First, create the new fields
ALTER TABLE exams
ADD COLUMN exam_month INTEGER,
ADD COLUMN exam_year INTEGER;

-- Populate the new fields from existing exam_date data
UPDATE exams
SET exam_month = EXTRACT(MONTH FROM exam_date),
    exam_year = EXTRACT(YEAR FROM exam_date)
WHERE exam_date IS NOT NULL;

-- Set default values for any existing records that don't have exam_date
UPDATE exams
SET exam_month = EXTRACT(MONTH FROM CURRENT_DATE),
    exam_year = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE exam_month IS NULL OR exam_year IS NULL;

-- Make the new fields NOT NULL
ALTER TABLE exams
ALTER COLUMN exam_month SET NOT NULL,
ALTER COLUMN exam_year SET NOT NULL;

-- Add constraints for month (1-12) and reasonable year range
ALTER TABLE exams
ADD CONSTRAINT exam_month_check CHECK (exam_month >= 1 AND exam_month <= 12),
ADD CONSTRAINT exam_year_check CHECK (exam_year >= 2020 AND exam_year <= 2030);

-- Now drop the old exam_date column
ALTER TABLE exams DROP COLUMN exam_date;

-- Add comments to document the new fields
COMMENT ON COLUMN exams.exam_month IS 'Month when the exam occurs (1-12)';
COMMENT ON COLUMN exams.exam_year IS 'Year when the exam occurs';