# Carthaplay Backend

## Database Schema

Below are the SQL statements to create the required tables for Carthaplay:

```sql
-- USERS table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    auth_user_id UUID,
    username VARCHAR,
    email VARCHAR,
    role VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    password TEXT
);

-- TEACHERS table
CREATE TABLE teachers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id)
);

-- STUDENTS table
CREATE TABLE students (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    student_code TEXT
);

-- CLASSROOM table
CREATE TABLE classroom (
    id BIGSERIAL PRIMARY KEY,
    name TEXT,
    code TEXT,
    teacher_id BIGINT REFERENCES teachers(id)
);

-- RELATION STUDENT ↔ CLASSROOM
CREATE TABLE rel_student_classroom (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT REFERENCES students(id),
    classroom_id BIGINT REFERENCES classroom(id)
);

-- GAMES table
CREATE TABLE games (
    id BIGSERIAL PRIMARY KEY,
    subject VARCHAR,
    lesson VARCHAR,
    difficulty VARCHAR,
    teacher_id BIGINT REFERENCES teachers(id),
    game_code TEXT,
    created_at TIMESTAMP,
    thinking_time INT,
    health INT
);

-- QUESTIONS table
CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,
    question TEXT,
    correct_answer TEXT,
    game_id BIGINT REFERENCES games(id),
    "order" INT,
    level INT,
    y INT
);

-- ANSWERS table
CREATE TABLE answers (
    id BIGSERIAL PRIMARY KEY,
    text TEXT,
    question_id BIGINT REFERENCES questions(id),
    isCorrect BOOLEAN
);

-- INFORMATIONS table
CREATE TABLE informations (
    id BIGSERIAL PRIMARY KEY,
    info TEXT,
    "order" INT,
    game_id BIGINT REFERENCES games(id),
    level INT
);

-- GAME LOGS table
CREATE TABLE game_logs (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ,
    player_id TEXT,
    event_type TEXT,
    event_data JSONB
);
```

## Environment Variables

Create a `.env` file in your `server` directory with the following content:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret
AI_SERVICE_URL=http://ai-service/generate-mcqs
PORT=3000
```

Replace the values with your actual credentials.

## Setup Instructions

1. Clone the repository and install dependencies:
   ```sh
   git clone <repo-url>
   cd Carthaplay/server
   npm install
   ```
2. Set up your `.env` file as described above.
3. Create the database tables using the SQL above (e.g., in Supabase SQL editor).
4. Start the backend server:
   ```sh
   npm start
   ```

## Notes
- Uploaded files (PDFs) are not stored in the database; only their extracted text is used.
- The `uploads/` directory is ignored by git (see `.gitignore`).
- Make sure your Supabase project is set up and the credentials are correct.

---

For any issues, please contact the project maintainer.
