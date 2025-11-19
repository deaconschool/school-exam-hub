-- School Examination Portal - Phase 3 Database Schema
-- Compatible with Supabase PostgreSQL
-- Created: November 17, 2025

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- 1. TEACHERS TABLE
-- =================================================================
CREATE TABLE teachers (
    id VARCHAR(20) PRIMARY KEY, -- Teacher ID (T001, T002, etc.)
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Hashed password
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert default teachers (passwords should be hashed in production)
INSERT INTO teachers (id, name, password_hash, email) VALUES
('T001', 'Mr. Andrew', '$2b$10$placeholder_hash_for_T001', 'andrew@school.edu'),
('T002', 'Mr. Antoon', '$2b$10$placeholder_hash_for_T002', 'antoon@school.edu'),
('T003', 'Mr. Mina', '$2b$10$placeholder_hash_for_T003', 'mina@school.edu');

-- =================================================================
-- 2. STUDENTS TABLE
-- =================================================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL, -- Student code (11111, 22222, etc.)
    name VARCHAR(255) NOT NULL,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 12),
    class VARCHAR(50) NOT NULL,
    stage VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert default students
INSERT INTO students (code, name, level, class, stage) VALUES
('11111', 'أحمد محمد علي', 5, '5أ', 'المرحلة الابتدائية'),
('22222', 'فاطمة حسن إبراهيم', 5, '5ب', 'المرحلة الابتدائية'),
('33333', 'محمد عبدالله خالد', 3, '3ج', 'المرحلة الابتدائية'),
('44444', 'نورة سالم أحمد', 4, '4أ', 'المرحلة الابتدائية'),
('55555', 'عمر علي حسن', 6, '6ب', 'المرحلة الابتدائية');

-- =================================================================
-- 3. EXAMS TABLE
-- =================================================================
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    exam_date TIMESTAMPTZ NOT NULL,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 12),
    subject VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert sample exams
INSERT INTO exams (title, description, exam_date, level, subject) VALUES
('اختبار نطق القرآن', 'اختبار تقييم نطق وحفظ القرآن الكريم', NOW() + INTERVAL '7 days', 5, 'القرآن الكريم'),
('اختبار التلاوة', 'اختبار تقييم أداء التلاوة والتجويد', NOW() + INTERVAL '14 days', 4, 'القرآن الكريم'),
('اختبار الحفظ', 'اختبار تقييم حفظ السور المحددة', NOW() + INTERVAL '21 days', 6, 'القرآن الكريم');

-- =================================================================
-- 4. GRADE_CRITERIA TABLE
-- =================================================================
CREATE TABLE grade_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    criterion_name VARCHAR(50) NOT NULL, -- tasleem, not2, ada2_gama3y
    min_value DECIMAL(5,2) NOT NULL DEFAULT 0,
    max_value DECIMAL(5,2) NOT NULL DEFAULT 20,
    description_ar TEXT,
    description_en TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(criterion_name)
);

-- Insert default grade criteria
INSERT INTO grade_criteria (criterion_name, min_value, max_value, description_ar, description_en) VALUES
('tasleem', 0, 20, 'التسليم والأداء العام', 'Delivery and overall performance'),
('not2', 0, 20, 'دقة النطق ووضوحه', 'Pronunciation accuracy and clarity'),
('ada2_gama3y', 0, 20, 'التفاعل مع المجموعة', 'Group interaction and participation');

-- =================================================================
-- 5. GRADES TABLE
-- =================================================================
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    teacher_id VARCHAR(20) REFERENCES teachers(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    tasleem_grade DECIMAL(5,2) CHECK (tasleem_grade >= 0 AND tasleem_grade <= 20),
    not2_grade DECIMAL(5,2) CHECK (not2_grade >= 0 AND not2_grade <= 20),
    ada2_gama3y_grade DECIMAL(5,2) CHECK (ada2_gama3y_grade >= 0 AND ada2_gama3y_grade <= 20),
    total_grade DECIMAL(6,2) GENERATED ALWAYS AS (tasleem_grade + not2_grade + ada2_gama3y_grade) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure a teacher can only grade a student once per exam
    UNIQUE(teacher_id, student_id, exam_id)
);

-- Create index for faster queries
CREATE INDEX idx_grades_student_id ON grades(student_id);
CREATE INDEX idx_grades_teacher_id ON grades(teacher_id);
CREATE INDEX idx_grades_exam_id ON grades(exam_id);
CREATE INDEX idx_grades_created_at ON grades(created_at);

-- =================================================================
-- 6. GRADE_AGGREGATES VIEW
-- =================================================================
CREATE VIEW grade_aggregates AS
SELECT
    s.id as student_id,
    s.code as student_code,
    s.name as student_name,
    e.id as exam_id,
    e.title as exam_title,
    COUNT(g.id) as total_grades,
    ROUND(AVG(g.total_grade), 2) as average_grade,
    ROUND(MAX(g.total_grade), 2) as highest_grade,
    ROUND(MIN(g.total_grade), 2) as lowest_grade,
    MAX(g.created_at) as last_graded_at
FROM students s
LEFT JOIN grades g ON s.id = g.student_id
LEFT JOIN exams e ON g.exam_id = e.id OR e IS NULL
GROUP BY s.id, s.code, s.name, e.id, e.title;

-- =================================================================
-- 7. FUNCTIONS AND TRIGGERS
-- =================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic updated_at
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grade_criteria_updated_at BEFORE UPDATE ON grade_criteria FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================

-- Enable RLS on all tables
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Teachers can see all students and grades, but can only modify their own grades
CREATE POLICY "Teachers can view all students" ON students FOR SELECT USING (true);
CREATE POLICY "Teachers can view all exams" ON exams FOR SELECT USING (true);
CREATE POLICY "Teachers can view all grade criteria" ON grade_criteria FOR SELECT USING (true);
CREATE POLICY "Teachers can view all grades" ON grades FOR SELECT USING (true);
CREATE POLICY "Teachers can only insert their own grades" ON grades FOR INSERT WITH CHECK (auth.uid()::text = teacher_id);
CREATE POLICY "Teachers can only update their own grades" ON grades FOR UPDATE USING (auth.uid()::text = teacher_id);

-- =================================================================
-- 9. SAMPLE DATA FOR TESTING
-- =================================================================

-- Insert sample grades for testing
INSERT INTO grades (student_id, teacher_id, exam_id, tasleem_grade, not2_grade, ada2_gama3y_grade, notes)
SELECT
    s.id,
    t.id,
    e.id,
    RANDOM() * 20,
    RANDOM() * 20,
    RANDOM() * 20,
    'Sample grade for testing'
FROM students s, teachers t, exams e
WHERE s.code IN ('11111', '22222')
LIMIT 10;

-- =================================================================
-- 10. USEFUL QUERIES
-- =================================================================

-- Get all grades for a specific student
/*
SELECT
    s.name as student_name,
    s.code as student_code,
    t.name as teacher_name,
    e.title as exam_title,
    g.tasleem_grade,
    g.not2_grade,
    g.ada2_gama3y_grade,
    g.total_grade,
    g.created_at
FROM grades g
JOIN students s ON g.student_id = s.id
JOIN teachers t ON g.teacher_id = t.id
JOIN exams e ON g.exam_id = e.id
WHERE s.code = '11111';
*/

-- Get all grades for a specific teacher
/*
SELECT
    t.name as teacher_name,
    s.name as student_name,
    s.code as student_code,
    e.title as exam_title,
    g.tasleem_grade,
    g.not2_grade,
    g.ada2_gama3y_grade,
    g.total_grade,
    g.created_at
FROM grades g
JOIN students s ON g.student_id = s.id
JOIN teachers t ON g.teacher_id = t.id
JOIN exams e ON g.exam_id = e.id
WHERE t.id = 'T001';
*/

-- Get grade statistics for an exam
/*
SELECT
    e.title as exam_title,
    COUNT(g.id) as total_grades,
    ROUND(AVG(g.total_grade), 2) as average_grade,
    ROUND(MAX(g.total_grade), 2) as highest_grade,
    ROUND(MIN(g.total_grade), 2) as lowest_grade
FROM exams e
LEFT JOIN grades g ON e.id = g.exam_id
GROUP BY e.id, e.title;
*/

-- =================================================================
-- 11. INDEXES FOR PERFORMANCE
-- =================================================================

CREATE INDEX idx_students_code ON students(code);
CREATE INDEX idx_students_level ON students(level);
CREATE INDEX idx_students_class ON students(class);

CREATE INDEX idx_exams_level ON exams(level);
CREATE INDEX idx_exams_date ON exams(exam_date);

CREATE INDEX idx_grades_teacher_exam ON grades(teacher_id, exam_id);
CREATE INDEX idx_grades_student_teacher ON grades(student_id, teacher_id);

-- =================================================================
-- END OF SCHEMA
-- =================================================================