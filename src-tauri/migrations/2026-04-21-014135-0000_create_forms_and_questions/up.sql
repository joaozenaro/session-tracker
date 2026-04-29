DROP TABLE IF EXISTS form_instances;
DROP TABLE IF EXISTS template_questions;
DROP TABLE IF EXISTS form_templates;

CREATE TABLE forms (
    id TEXT PRIMARY KEY NOT NULL,
    client_id TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE form_questions (
    id TEXT PRIMARY KEY NOT NULL,
    form_id TEXT NOT NULL,
    question_type TEXT NOT NULL,
    question_text TEXT NOT NULL,
    options TEXT,
    position INTEGER NOT NULL,
    answer_text TEXT,
    answer_yes_no BOOLEAN,
    answer_why_not TEXT,
    answer_checkbox BOOLEAN,
    answer_number REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);
