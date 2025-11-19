-- =================================================================
-- MIGRATION: SETUP STAGES AND CLASSES TABLES
-- Run this in your Supabase SQL Editor to create the complete hierarchy
-- =================================================================

-- Create stages table if it doesn't exist
CREATE TABLE IF NOT EXISTS stages (
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

-- Create classes table if it doesn't exist
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_level INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert stages data (using ON CONFLICT DO NOTHING to prevent duplicates)
INSERT INTO stages (level, name_ar, name_en, description_ar, description_en) VALUES
(0, 'حضانة', 'Kindergarten', 'مرحلة ما قبل الابتدائية للأطفال الصغار', 'Pre-primary stage for young children'),
(1, 'أولى وثانية ابتدائى', 'First and Second Primary', 'السنوات الأولى من المرحلة الابتدائية', 'First years of primary education'),
(2, 'ثالثة ورابعة ابتدائى', 'Third and Fourth Primary', 'السنوات الوسطى من المرحلة الابتدائية', 'Middle years of primary education'),
(3, 'خامسة وسادسة ابتدائى', 'Fifth and Sixth Primary', 'السنوات الأخيرة من المرحلة الابتدائية', 'Final years of primary education'),
(4, 'اعدادى وثانوى', 'Preparatory and Secondary', 'مرحلة ما قبل الجامعة', 'Pre-university education stage')
ON CONFLICT (level) DO NOTHING;

-- Insert classes data (using ON CONFLICT DO NOTHING to prevent duplicates)
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
(4, 'القديسة العذراء مريم', 'فصل القديسة العذراء للمرحلة الإعدادية والثانوية', 'Class Saint Virgin Mary for Preparatory and Secondary')
ON CONFLICT (stage_level, name) DO NOTHING;

-- Enable RLS on the new tables
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stages
CREATE POLICY IF NOT EXISTS "Anyone can view active stages" ON stages FOR SELECT USING (
  is_active = true
);

CREATE POLICY IF NOT EXISTS "Admins can manage stages" ON stages FOR ALL USING (
  auth.role() = 'service_role' OR
  auth.jwt() ->> 'role' = 'admin'
);

-- Create RLS policies for classes
CREATE POLICY IF NOT EXISTS "Anyone can view active classes" ON classes FOR SELECT USING (
  is_active = true
);

CREATE POLICY IF NOT EXISTS "Admins can manage classes" ON classes FOR ALL USING (
  auth.role() = 'service_role' OR
  auth.jwt() ->> 'role' = 'admin'
);

-- Insert sample exams that reference the actual classes
INSERT INTO exams (title, description, url, exam_date, level, subject, class, require_pin, pin_password, pin_enabled, pin_description) VALUES
('اختبار حروف وأرقام', 'اختبار تقييم الحروف والأرقام الروضة', 'https://exam-platform.com/kindergarten-letters-0', NOW() + INTERVAL '7 days', 0, 'حروف وأرقام', 'الملاك ميخائيل', true, '1111', true, 'أدخل رمز الامتحان للروضة'),
('اختبار قبطى', 'اختبار تقييم قبطى للصف الأول والثاني', 'https://exam-platform.com/coptic-1a', NOW() + INTERVAL '14 days', 1, 'قبطى', 'القديس أبانوب', false, null, false, null),
('اختبار طقس', 'اختبار تقييم طقس للصف الأول والثاني', 'https://exam-platform.com/ritual-1b', NOW() + INTERVAL '21 days', 1, 'طقس', 'القديس كرياكوس', true, '2222', true, 'أدخل رمز الامتحان للطقس'),
('اختبار عقيدة', 'اختبار تقييم عقيدة للصف الثالث والرابع', 'https://exam-platform.com/creed-2a', NOW() + INTERVAL '28 days', 2, 'عقيدة', 'القديس استفانوس', false, null, false, null),
('اختبار تاريخ الكنيسة', 'اختبار تقييم تاريخ الكنيسة للصف الثالث والرابع', 'https://exam-platform.com/church-history-2b', NOW() + INTERVAL '35 days', 2, 'تاريخ الكنيسة', 'الفديس مارمرقس', true, '3333', true, 'أدخل رمز الامتحان للتاريخ'),
('اختبار قديسين', 'اختبار تقييم قديسين للصف الخامس والسادس', 'https://exam-platform.com/saints-3a', NOW() + INTERVAL '42 days', 3, 'قديسين', 'البابا أثناسيوس', false, null, false, null),
('اختبار قرآن متقدم', 'اختبار تقييم قرآن متقدم للصف الخامس والسادس', 'https://exam-platform.com/advanced-quran-3b', NOW() + INTERVAL '49 days', 3, 'قرآن الكريم', 'البابا كيرلس الكبير', true, '4444', true, 'أدخل رمز الامتحان للقرآن'),
('اختبار لاهوت', 'اختبار تقييم لاهوت للمرحلة الإعدادية والثانوية', 'https://exam-platform.com/theology-4a', NOW() + INTERVAL '56 days', 4, 'لاهوت', 'القديس ديسقورس', false, null, false, null),
('اختبار فلسفة', 'اختبار تقييم فلسفة للمرحلة الإعدادية والثانوية', 'https://exam-platform.com/philosophy-4b', NOW() + INTERVAL '63 days', 4, 'فلسفة', 'القديسة العذراء مريم', true, '5555', true, 'أدخل رمز الامتحان للفلسفة')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON stages TO service_role;
GRANT ALL ON classes TO service_role;