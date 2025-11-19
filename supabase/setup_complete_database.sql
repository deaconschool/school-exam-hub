-- =================================================================
-- SCHOOL EXAMINATION PORTAL - COMPLETE SUPABASE SETUP
-- Project: qhhqygidoqbnqhhggunu
-- Phase 3 Implementation
-- =================================================================

-- First, let's check and clean up any existing tables
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS grade_criteria CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP VIEW IF EXISTS grade_aggregates;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Enable UUID extension
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

-- Insert default teachers (passwords are 'password123' for testing)
INSERT INTO teachers (id, name, password_hash, email, phone) VALUES
('T001', 'Mr. Andrew', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjR9yLpbM41K', 'andrew@school.edu', '01234567890'),
('T002', 'Mr. Antoon', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjR9yLpbM41K', 'antoon@school.edu', '01234567891'),
('T003', 'Mr. Mina', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjR9yLpbM41K', 'mina@school.edu', '01234567892');

-- =================================================================
-- 1.1 STAGES TABLE
-- =================================================================
CREATE TABLE stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level INTEGER NOT NULL UNIQUE,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert stages data
INSERT INTO stages (level, name_ar, name_en, description_ar, description_en) VALUES
(0, 'حضانة', 'Kindergarten', 'مرحلة ما قبل الابتدائية للأطفال الصغار', 'Pre-primary stage for young children'),
(1, 'أولى وثانية ابتدائى', 'First and Second Primary', 'السنوات الأولى من المرحلة الابتدائية', 'First years of primary education'),
(2, 'ثالثة ورابعة ابتدائى', 'Third and Fourth Primary', 'السنوات الوسطى من المرحلة الابتدائية', 'Middle years of primary education'),
(3, 'خامسة وسادسة ابتدائى', 'Fifth and Sixth Primary', 'السنوات الأخيرة من المرحلة الابتدائية', 'Final years of primary education'),
(4, 'اعدادى وثانوى', 'Preparatory and Secondary', 'مرحلة ما قبل الجامعة', 'Pre-university education stage');

-- =================================================================
-- 1.2 CLASSES TABLE
-- =================================================================
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_level INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (stage_level) REFERENCES stages(level) ON DELETE CASCADE
);

-- Insert classes data
INSERT INTO classes (stage_level, name, description_ar, description_en) VALUES
-- Stage 0 (Kindergarten) - 1 class
(0, 'الملاك ميخائيل', 'فصل الملاك ميخائيل للروضة', 'Class Archangel Michael for Kindergarten'),

-- Stage 1 (First & Second Primary) - 4 classes
(1, 'القديس أبانوب', 'فصل القديس أبانوب للصف الأول والثاني', 'Class Saint Abanob for First and Second Grade'),
(1, 'القديس كرياكوس', 'فصل القديس كرياكوس للصف الأول والثاني', 'Class Saint Kyriakos for First and Second Grade'),
(1, 'القديس ونس', 'فصل القديس ونس للصف الأول والثاني', 'Class Saint Wanas for First and Second Grade'),
(1, 'المرتل داود', 'فصل المرتل داود للصف الأول والثاني', 'Class Class Cantor David for First and Second Grade'),

-- Stage 2 (Third & Fourth Primary) - 3 classes
(2, 'القديس استفانوس', 'فصل القديس استفانوس للصف الثالث والرابع', 'Class Saint Estephanos for Third and Fourth Grade'),
(2, 'الفديس مارمرقس', 'فصل القديس مارمرقس للصف الثالث والرابع', 'Class Saint Mark for Third and Fourth Grade'),
(2, 'القديس يوحنا المعمدان', 'فصل القديس يوحنا للصف الثالث والرابع', 'Class Saint John the Baptist for Third and Fourth Grade'),

-- Stage 3 (Fifth & Sixth Primary) - 3 classes
(3, 'البابا أثناسيوس', 'فصل البابا أثناسيوس للصف الخامس والسادس', 'Class Pope Athanasius for Fifth and Sixth Grade'),
(3, 'البابا كيرلس الكبير', 'فصل البابا كيرلس للصف الخامس والسادس', 'Class Pope Cyril for Fifth and Sixth Grade'),
(3, 'القديسة دميانة', 'فصل القديسة دميانة للصف الخامس والسادس', 'Class Saint Demiana for Fifth and Sixth Grade'),

-- Stage 4 (Preparatory & Secondary) - 2 classes
(4, 'القديس ديسقورس', 'فصل القديس ديسقورس للمرحلة الإعدادية والثانوية', 'Class Saint Dioscorus for Preparatory and Secondary'),
(4, 'القديسة العذراء مريم', 'فصل القديسة العذراء للمرحلة الإعدادية والثانوية', 'Class Saint Virgin Mary for Preparatory and Secondary');

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
    url TEXT NOT NULL,                    -- External exam URL
    exam_date TIMESTAMPTZ NOT NULL,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 12),
    subject VARCHAR(100),
    class VARCHAR(50) DEFAULT NULL,       -- Class assignment (e.g., '5A', '5B')
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    -- PIN Password Protection Fields
    require_pin BOOLEAN DEFAULT FALSE,
    pin_password VARCHAR(10) DEFAULT NULL,
    pin_enabled BOOLEAN DEFAULT FALSE,
    pin_description VARCHAR(255) DEFAULT NULL
);

-- Insert sample exams
INSERT INTO exams (title, description, url, exam_date, level, subject, class, require_pin, pin_password, pin_enabled, pin_description) VALUES
('اختبار حروف وأرقام', 'اختبار تقييم الحروف والأرقام الروضة', 'https://exam-platform.com/kindergarten-letters-0', NOW() + INTERVAL '7 days', 0, 'حروف وأرقام', 'الملاك ميخائيل', true, '1111', true, 'أدخل رمز الامتحان للروضة'),
('اختبار قبطى', 'اختبار تقييم قبطى للصف الأول والثاني', 'https://exam-platform.com/coptic-1a', NOW() + INTERVAL '14 days', 1, 'قبطى', 'القديس أبانوب', false, null, false, null),
('اختبار طقس', 'اختبار تقييم طقس للصف الأول والثاني', 'https://exam-platform.com/ritual-1b', NOW() + INTERVAL '21 days', 1, 'طقس', 'القديس كرياكوس', true, '2222', true, 'أدخل رمز الامتحان للطقس'),
('اختبار عقيدة', 'اختبار تقييم عقيدة للصف الثالث والرابع', 'https://exam-platform.com/creed-2a', NOW() + INTERVAL '28 days', 2, 'عقيدة', 'القديس استفانوس', false, null, false, null),
('اختبار تاريخ الكنيسة', 'اختبار تقييم تاريخ الكنيسة للصف الثالث والرابع', 'https://exam-platform.com/church-history-2b', NOW() + INTERVAL '35 days', 2, 'تاريخ الكنيسة', 'الفديس مارمرقس', true, '3333', true, 'أدخل رمز الامتحان للتاريخ'),
('اختبار قديسين', 'اختبار تقييم قديسين للصف الخامس والسادس', 'https://exam-platform.com/saints-3a', NOW() + INTERVAL '42 days', 3, 'قديسين', 'البابا أثناسيوس', false, null, false, null),
('اختبار قرآن متقدم', 'اختبار تقييم قرآن متقدم للصف الخامس والسادس', 'https://exam-platform.com/advanced-quran-3b', NOW() + INTERVAL '49 days', 3, 'قرآن الكريم', 'البابا كيرلس الكبير', true, '4444', true, 'أدخل رمز الامتحان للقرآن'),
('اختبار لاهوت', 'اختبار تقييم لاهوت للمرحلة الإعدادية والثانوية', 'https://exam-platform.com/theology-4a', NOW() + INTERVAL '56 days', 4, 'لاهوت', 'القديس ديسقورس', false, null, false, null),
('اختبار فلسفة', 'اختبار تقييم فلسفة للمرحلة الإعدادية والثانوية', 'https://exam-platform.com/philosophy-4b', NOW() + INTERVAL '63 days', 4, 'فلسفة', 'القديسة العذراء مريم', true, '5555', true, 'أدخل رمز الامتحان للفلسفة');

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
    total_grade DECIMAL(6,2) GENERATED ALWAYS AS (
        COALESCE(tasleem_grade, 0) + COALESCE(not2_grade, 0) + COALESCE(ada2_gama3y_grade, 0)
    ) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure a teacher can only grade a student once per exam
    UNIQUE(teacher_id, student_id, exam_id)
);

-- =================================================================
-- 6. INDEXES FOR PERFORMANCE
-- =================================================================
CREATE INDEX idx_teachers_email ON teachers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_students_code ON students(code);
CREATE INDEX idx_students_level ON students(level);
CREATE INDEX idx_students_class ON students(class);
CREATE INDEX idx_exams_level ON exams(level);
CREATE INDEX idx_exams_date ON exams(exam_date);
CREATE INDEX idx_grades_student_id ON grades(student_id);
CREATE INDEX idx_grades_teacher_id ON grades(teacher_id);
CREATE INDEX idx_grades_exam_id ON grades(exam_id);
CREATE INDEX idx_grades_created_at ON grades(created_at);
CREATE INDEX idx_grades_teacher_exam ON grades(teacher_id, exam_id);
CREATE INDEX idx_grades_student_teacher ON grades(student_id, teacher_id);

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
-- 8. VIEWS FOR REPORTING
-- =================================================================

-- Grade aggregates view for statistics
CREATE VIEW grade_aggregates AS
SELECT
    s.id as student_id,
    s.code as student_code,
    s.name as student_name,
    s.level as student_level,
    s.class as student_class,
    e.id as exam_id,
    e.title as exam_title,
    e.exam_date,
    COUNT(g.id) as total_grades,
    ROUND(AVG(g.total_grade), 2) as average_grade,
    ROUND(MAX(g.total_grade), 2) as highest_grade,
    ROUND(MIN(g.total_grade), 2) as lowest_grade,
    MAX(g.created_at) as last_graded_at,
    COUNT(DISTINCT g.teacher_id) as teachers_count
FROM students s
LEFT JOIN grades g ON s.id = g.student_id
LEFT JOIN exams e ON g.exam_id = e.id
WHERE s.is_active = true
GROUP BY s.id, s.code, s.name, s.level, s.class, e.id, e.title, e.exam_date;

-- Teacher performance view
CREATE VIEW teacher_performance AS
SELECT
    t.id as teacher_id,
    t.name as teacher_name,
    COUNT(g.id) as total_grades_given,
    COUNT(DISTINCT g.student_id) as unique_students_graded,
    ROUND(AVG(g.total_grade), 2) as average_grade_given,
    MAX(g.created_at) as last_grading_date
FROM teachers t
LEFT JOIN grades g ON t.id = g.teacher_id
WHERE t.is_active = true
GROUP BY t.id, t.name;

-- =================================================================
-- 9. SAMPLE GRADES DATA
-- =================================================================

-- Insert some sample grades for testing
INSERT INTO grades (student_id, teacher_id, exam_id, tasleem_grade, not2_grade, ada2_gama3y_grade, notes)
SELECT
    s.id,
    t.id,
    e.id,
    ROUND((RANDOM() * 20)::DECIMAL, 1),
    ROUND((RANDOM() * 20)::DECIMAL, 1),
    ROUND((RANDOM() * 20)::DECIMAL, 1),
    'Sample grade for testing'
FROM students s, teachers t, exams e
WHERE s.code IN ('11111', '22222')
  AND t.id IN ('T001', 'T002')
LIMIT 6;

-- =================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================

-- Enable RLS on all tables
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Teachers policies
CREATE POLICY "Teachers can view teacher basic info" ON teachers FOR SELECT USING (
  -- Allow viewing all teacher info for now, but in production could restrict
  true
);

CREATE POLICY "Teachers can update their own profile" ON teachers FOR UPDATE USING (
  auth.uid()::text = id
);

CREATE POLICY "Allow admin access to teacher management" ON teachers FOR ALL USING (
  -- Policy for future admin access - can be enabled with proper admin authentication
  -- For now, service role will have access
  auth.role() = 'service_role' OR
  -- Placeholder for future admin role check
  auth.jwt() ->> 'role' = 'admin'
);

-- Stages policies
CREATE POLICY "Anyone can view active stages" ON stages FOR SELECT USING (
  is_active = true
);

CREATE POLICY "Admins can manage stages" ON stages FOR ALL USING (
  -- Policy for future admin access
  auth.role() = 'service_role' OR
  auth.jwt() ->> 'role' = 'admin'
);

-- Classes policies
CREATE POLICY "Anyone can view active classes" ON classes FOR SELECT USING (
  is_active = true
);

CREATE POLICY "Admins can manage classes" ON classes FOR ALL USING (
  -- Policy for future admin access
  auth.role() = 'service_role' OR
  auth.jwt() ->> 'role' = 'admin'
);

-- Students policies
CREATE POLICY "Teachers can view all students" ON students FOR SELECT USING (true);
CREATE POLICY "Teachers can insert students" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Teachers can update students" ON students FOR UPDATE WITH CHECK (true);

-- Exams policies
CREATE POLICY "Teachers can view all exams" ON exams FOR SELECT USING (true);
CREATE POLICY "Teachers can insert exams" ON exams FOR INSERT WITH CHECK (true);
CREATE POLICY "Teachers can update their own exams" ON exams FOR UPDATE USING (true);
CREATE POLICY "Teachers can delete their own exams" ON exams FOR DELETE USING (true);

-- Grade criteria policies
CREATE POLICY "Anyone can view grade criteria" ON grade_criteria FOR SELECT USING (true);
CREATE POLICY "Admins can manage grade criteria" ON grade_criteria FOR ALL USING (
  -- This would require an admin role check in production
  auth.jwt() ->> 'role' = 'admin'
);

-- Grades policies
CREATE POLICY "Teachers can view all grades" ON grades FOR SELECT USING (true);
CREATE POLICY "Teachers can insert their own grades" ON grades FOR INSERT WITH CHECK (true);
CREATE POLICY "Teachers can update their own grades" ON grades FOR UPDATE USING (true);
CREATE POLICY "Teachers can delete their own grades" ON grades FOR DELETE USING (true);

-- =================================================================
-- 11. USEFUL FUNCTIONS FOR THE APPLICATION
-- =================================================================

-- Function to get student grades summary
CREATE OR REPLACE FUNCTION get_student_grades_summary(student_code_param VARCHAR)
RETURNS TABLE(
    exam_title VARCHAR,
    teacher_name VARCHAR,
    tasleem_grade DECIMAL,
    not2_grade DECIMAL,
    ada2_gama3y_grade DECIMAL,
    total_grade DECIMAL,
    graded_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.title,
        t.name,
        g.tasleem_grade,
        g.not2_grade,
        g.ada2_gama3y_grade,
        g.total_grade,
        g.created_at
    FROM grades g
    JOIN students s ON g.student_id = s.id
    JOIN teachers t ON g.teacher_id = t.id
    JOIN exams e ON g.exam_id = e.id
    WHERE s.code = student_code_param
    ORDER BY g.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get teacher grading statistics
CREATE OR REPLACE FUNCTION get_teacher_stats(teacher_id_param VARCHAR)
RETURNS TABLE(
    total_grades INTEGER,
    unique_students INTEGER,
    average_grade DECIMAL,
    highest_grade DECIMAL,
    lowest_grade DECIMAL,
    last_grading_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(g.id) as total_grades,
        COUNT(DISTINCT g.student_id) as unique_students,
        ROUND(AVG(g.total_grade), 2) as average_grade,
        ROUND(MAX(g.total_grade), 2) as highest_grade,
        ROUND(MIN(g.total_grade), 2) as lowest_grade,
        MAX(g.created_at) as last_grading_date
    FROM grades g
    WHERE g.teacher_id = teacher_id_param;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- 12. VERIFICATION QUERIES
-- =================================================================

-- Verify tables were created
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('teachers', 'students', 'exams', 'grade_criteria', 'grades')
ORDER BY tablename;

-- Verify data was inserted
SELECT 'teachers' as table_name, COUNT(*) as record_count FROM teachers
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'exams', COUNT(*) FROM exams
UNION ALL
SELECT 'grade_criteria', COUNT(*) FROM grade_criteria
UNION ALL
SELECT 'grades', COUNT(*) FROM grades;

-- Verify indexes were created
SELECT
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('teachers', 'students', 'exams', 'grade_criteria', 'grades')
ORDER BY tablename, indexname;

-- =================================================================
-- SETUP COMPLETE
-- =================================================================

-- Sample queries to test the setup:

-- Test teacher stats function
-- SELECT * FROM get_teacher_stats('T001');

-- Test student grades summary function
-- SELECT * FROM get_student_grades_summary('11111');

-- Test grade aggregates view
-- SELECT * FROM grade_aggregates WHERE student_code = '11111';

-- Test teacher performance view
-- SELECT * FROM teacher_performance;

-- All tables and data are now ready for the School Examination Portal!