-- 초기 데이터 삽입 (didim_database_v2.sql 기반)

-- 1. User 데이터 (비밀번호는 'password'를 BCrypt로 암호화한 예시: $2a$10$76atvS.uWv0SIn8B2Z/jMOn1.I8W8E9lCjO/oY/h6lG7C7BfXoWKG)
INSERT INTO user (user_id, email, password, name, role, created_at) VALUES 
('admin-001', 'admin@didim.com', '$2a$10$76atvS.uWv0SIn8B2Z/jMOn1.I8W8E9lCjO/oY/h6lG7C7BfXoWKG', '관리자', 'admin', NOW()),
('student-001', 'student@didim.com', '$2a$10$76atvS.uWv0SIn8B2Z/jMOn1.I8W8E9lCjO/oY/h6lG7C7BfXoWKG', '김철수', 'student', NOW());

-- 2. Company 데이터
INSERT INTO company (company_id, company_name, talent_type, culture, interview_types, resume_questions, preferred_skills, created_at) VALUES 
('company-001', '삼성전자', '기술중심, 글로벌 역량', '체계적, 전문성 중시', '["기술면접", "임원면접"]', '["지원동기", "입사 후 포부"]', '["Java", "Python"]', NOW()),
('company-002', '네이버', '사용자 중심, 혁신', '유연한 조직문화', '["코딩테스트", "기술면접"]', '["문제해결 경험"]', '["React", "Spring"]', NOW());

-- 3. Job Posting 데이터
INSERT INTO job_posting (job_id, company_name, job_title, deadline, salary, requirements, description, created_at) VALUES 
('job-001', '네이버', '백엔드 신입 개발자', '2026-12-31', '협의', 'Java/Spring 숙련자', '서비스 백엔드 개발 및 운영', NOW()),
('job-002', '카카오', '프론트엔드 개발자', '2026-12-31', '협의', 'React/TypeScript 가능자', '플랫폼 프론트엔드 개발', NOW());

-- 4. Portfolio 데이터 (student-001)
INSERT INTO portfolio (portfolio_id, user_id, gpa, awards, scholarships, volunteer, certifications, updated_at) VALUES 
('port-001', 'student-001', 4.25, '[{"name": "캡스톤 금상", "year": 2024}]', '[]', '[]', '[]', NOW());
