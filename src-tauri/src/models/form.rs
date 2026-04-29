use diesel::prelude::*;
use serde::{Deserialize, Serialize};

use crate::schema::{forms, form_questions};

#[derive(Queryable, Selectable, Insertable, Identifiable, AsChangeset, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = forms)]
pub struct Form {
    pub id: String,
    pub client_id: Option<String>,
    pub title: String,
    pub description: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Insertable, Deserialize, Serialize, Debug, Clone)]
#[diesel(table_name = forms)]
pub struct NewForm {
    pub id: String,
    pub client_id: Option<String>,
    pub title: String,
    pub description: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Queryable, Selectable, Insertable, Identifiable, AsChangeset, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = form_questions)]
pub struct FormQuestion {
    pub id: String,
    pub form_id: String,
    pub question_type: String,
    pub question_text: String,
    pub options: Option<String>,
    pub position: i32,
    pub answer_text: Option<String>,
    pub answer_yes_no: Option<bool>,
    pub answer_why_not: Option<String>,
    pub answer_checkbox: Option<bool>,
    pub answer_number: Option<f32>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Insertable, Deserialize, Serialize, Debug, Clone)]
#[diesel(table_name = form_questions)]
pub struct NewFormQuestion {
    pub id: String,
    pub form_id: String,
    pub question_type: String,
    pub question_text: String,
    pub options: Option<String>,
    pub position: i32,
    pub answer_text: Option<String>,
    pub answer_yes_no: Option<bool>,
    pub answer_why_not: Option<String>,
    pub answer_checkbox: Option<bool>,
    pub answer_number: Option<f32>,
    pub created_at: String,
    pub updated_at: String,
}
