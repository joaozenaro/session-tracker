export type QuestionType = 'checkbox' | 'yes_no' | 'text' | 'number' | 'textarea' | 'dropdown';

export interface Form {
  id: string;
  client_id: string | null;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface FormPayload {
  title: string;
  description: string;
}

export interface FormQuestion {
  id: string;
  form_id: string;
  question_type: QuestionType;
  question_text: string;
  options: string | null; // e.g. "[\"Option 1\",\"Option 2\"]"
  position: number;
  answer_text: string | null;
  answer_yes_no: boolean | null;
  answer_why_not: string | null;
  answer_checkbox: boolean | null;
  answer_number: number | null;
  created_at: string;
  updated_at: string;
}

export interface FormQuestionPayload {
  question_type: QuestionType;
  question_text: string;
  options: string | null;
  position: number;
  answer_text: string | null;
  answer_yes_no: boolean | null;
  answer_why_not: string | null;
  answer_checkbox: boolean | null;
  answer_number: number | null;
}
