use chrono::Utc;
use diesel::prelude::*;
use serde::Deserialize;
use uuid::Uuid;

use crate::commands::blocking;
use crate::error::{AppError, CmdResult as Result};
use crate::models::{Form, FormQuestion, NewForm, NewFormQuestion};
use crate::db::DbPool;

// DTOs
#[derive(Deserialize)]
pub struct FormPayload {
    pub title: String,
    pub description: String,
}

#[derive(Deserialize)]
pub struct FormQuestionPayload {
    pub question_type: String,
    pub question_text: String,
    pub options: Option<String>,
    pub position: i32,
    pub answer_text: Option<String>,
    pub answer_yes_no: Option<bool>,
    pub answer_why_not: Option<String>,
    pub answer_checkbox: Option<bool>,
    pub answer_number: Option<f32>,
}

#[tauri::command]
pub async fn get_templates(pool: tauri::State<'_, DbPool>) -> Result<Vec<Form>> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        use crate::schema::forms::dsl::*;
        forms
            .filter(client_id.is_null())
            .order(created_at.desc())
            .load::<Form>(conn)
            .map_err(AppError::from)
    })
}

#[tauri::command]
pub async fn get_client_forms(
    client_id_val: String,
    pool: tauri::State<'_, DbPool>,
) -> Result<Vec<Form>> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        use crate::schema::forms::dsl::*;
        forms
            .filter(client_id.eq(client_id_val))
            .order(created_at.desc())
            .load::<Form>(conn)
            .map_err(AppError::from)
    })
}

#[tauri::command]
pub async fn create_template(
    payload: FormPayload,
    pool: tauri::State<'_, DbPool>,
) -> Result<Form> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        use crate::schema::forms::dsl::*;
        let new_id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true);

        let new_form = NewForm {
            id: new_id,
            client_id: None,
            title: payload.title,
            description: payload.description,
            created_at: now.clone(),
            updated_at: now,
        };

        diesel::insert_into(forms)
            .values(&new_form)
            .execute(conn)?;

        forms.find(new_form.id).first(conn).map_err(AppError::from)
    })
}

#[tauri::command]
pub async fn create_client_form(
    client_id_val: String,
    payload: FormPayload,
    pool: tauri::State<'_, DbPool>,
) -> Result<Form> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        use crate::schema::forms::dsl::*;
        let new_id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true);

        let new_form = NewForm {
            id: new_id,
            client_id: Some(client_id_val),
            title: payload.title,
            description: payload.description,
            created_at: now.clone(),
            updated_at: now,
        };

        diesel::insert_into(forms)
            .values(&new_form)
            .execute(conn)?;

        forms.find(new_form.id).first(conn).map_err(AppError::from)
    })
}

#[tauri::command]
pub async fn copy_template_to_client(
    client_id_val: String,
    template_id: String,
    pool: tauri::State<'_, DbPool>,
) -> Result<Form> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        use crate::schema::form_questions::dsl as fq_dsl;
        use crate::schema::forms::dsl as f_dsl;
        
        let template = f_dsl::forms
            .find(template_id.clone())
            .first::<Form>(conn)?;

        let new_form_id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true);

        let new_form = NewForm {
            id: new_form_id.clone(),
            client_id: Some(client_id_val),
            title: template.title,
            description: template.description,
            created_at: now.clone(),
            updated_at: now.clone(),
        };

        diesel::insert_into(f_dsl::forms)
            .values(&new_form)
            .execute(conn)?;

        let t_questions = fq_dsl::form_questions
            .filter(fq_dsl::form_id.eq(template_id))
            .load::<FormQuestion>(conn)?;

        for q in t_questions {
            let new_q_id = Uuid::new_v4().to_string();
            let new_q = NewFormQuestion {
                id: new_q_id,
                form_id: new_form_id.clone(),
                question_type: q.question_type,
                question_text: q.question_text,
                options: q.options,
                position: q.position,
                answer_text: None,
                answer_yes_no: None,
                answer_why_not: None,
                answer_checkbox: None,
                answer_number: None,
                created_at: now.clone(),
                updated_at: now.clone(),
            };
            diesel::insert_into(fq_dsl::form_questions)
                .values(&new_q)
                .execute(conn)?;
        }

        f_dsl::forms.find(new_form_id).first(conn).map_err(AppError::from)
    })
}

#[tauri::command]
pub async fn update_form(
    id: String,
    payload: FormPayload,
    pool: tauri::State<'_, DbPool>,
) -> Result<Form> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        use crate::schema::forms::dsl as f_dsl;
        let now = Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true);

        diesel::update(f_dsl::forms.find(&id))
            .set((
                f_dsl::title.eq(payload.title),
                f_dsl::description.eq(payload.description),
                f_dsl::updated_at.eq(now),
            ))
            .execute(conn)?;

        f_dsl::forms.find(id).first(conn).map_err(AppError::from)
    })
}

#[tauri::command]
pub async fn delete_form(id: String, pool: tauri::State<'_, DbPool>) -> Result<()> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        use crate::schema::forms::dsl as f_dsl;
        diesel::delete(f_dsl::forms.find(id))
            .execute(conn)
            .map(|_| ())
            .map_err(AppError::from)
    })
}

#[tauri::command]
pub async fn get_form_questions(
    form_id_val: String,
    pool: tauri::State<'_, DbPool>,
) -> Result<Vec<FormQuestion>> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        use crate::schema::form_questions::dsl::*;
        form_questions
            .filter(form_id.eq(form_id_val))
            .order(position.asc())
            .load::<FormQuestion>(conn)
            .map_err(AppError::from)
    })
}

#[tauri::command]
pub async fn create_question(
    form_id_val: String,
    payload: FormQuestionPayload,
    pool: tauri::State<'_, DbPool>,
) -> Result<FormQuestion> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        use crate::schema::form_questions::dsl::*;
        let new_id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true);

        let new_q = NewFormQuestion {
            id: new_id,
            form_id: form_id_val,
            question_type: payload.question_type,
            question_text: payload.question_text,
            options: payload.options,
            position: payload.position,
            answer_text: payload.answer_text,
            answer_yes_no: payload.answer_yes_no,
            answer_why_not: payload.answer_why_not,
            answer_checkbox: payload.answer_checkbox,
            answer_number: payload.answer_number,
            created_at: now.clone(),
            updated_at: now,
        };

        diesel::insert_into(form_questions)
            .values(&new_q)
            .execute(conn)?;

        form_questions.find(new_q.id).first(conn).map_err(AppError::from)
    })
}

#[tauri::command]
pub async fn update_question(
    id: String,
    payload: FormQuestionPayload,
    pool: tauri::State<'_, DbPool>,
) -> Result<FormQuestion> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        use crate::schema::form_questions::dsl as fq_dsl;
        let now = Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true);

        diesel::update(fq_dsl::form_questions.find(&id))
            .set((
                fq_dsl::question_type.eq(payload.question_type),
                fq_dsl::question_text.eq(payload.question_text),
                fq_dsl::options.eq(payload.options),
                fq_dsl::position.eq(payload.position),
                fq_dsl::answer_text.eq(payload.answer_text),
                fq_dsl::answer_yes_no.eq(payload.answer_yes_no),
                fq_dsl::answer_why_not.eq(payload.answer_why_not),
                fq_dsl::answer_checkbox.eq(payload.answer_checkbox),
                fq_dsl::answer_number.eq(payload.answer_number),
                fq_dsl::updated_at.eq(now),
            ))
            .execute(conn)?;

        fq_dsl::form_questions.find(id).first(conn).map_err(AppError::from)
    })
}

#[tauri::command]
pub async fn delete_question(id: String, pool: tauri::State<'_, DbPool>) -> Result<()> {
    let pool = pool.inner().clone();
    blocking!(pool, |conn: &mut SqliteConnection| {
        use crate::schema::form_questions::dsl as fq_dsl;
        diesel::delete(fq_dsl::form_questions.find(id))
            .execute(conn)
            .map(|_| ())
            .map_err(AppError::from)
    })
}
