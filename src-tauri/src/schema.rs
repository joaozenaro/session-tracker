// @generated automatically by Diesel CLI.

diesel::table! {
    clients (id) {
        id -> Text,
        name -> Text,
        telephone -> Text,
        created_at -> Text,
        plan -> Text,
        medications -> Text,
        color -> Text,
    }
}

diesel::table! {
    form_questions (id) {
        id -> Text,
        form_id -> Text,
        question_type -> Text,
        question_text -> Text,
        options -> Nullable<Text>,
        position -> Integer,
        answer_text -> Nullable<Text>,
        answer_yes_no -> Nullable<Bool>,
        answer_why_not -> Nullable<Text>,
        answer_checkbox -> Nullable<Bool>,
        answer_number -> Nullable<Float>,
        created_at -> Text,
        updated_at -> Text,
    }
}

diesel::table! {
    forms (id) {
        id -> Text,
        client_id -> Nullable<Text>,
        title -> Text,
        description -> Text,
        created_at -> Text,
        updated_at -> Text,
    }
}

diesel::table! {
    session_series (id) {
        id -> Text,
        client_id -> Text,
        recurrence_type -> Text,
        created_at -> Text,
    }
}

diesel::table! {
    sessions (id) {
        id -> Text,
        client_id -> Text,
        session_date -> Text,
        session_time -> Text,
        notes -> Text,
        series_id -> Nullable<Text>,
        created_at -> Text,
        updated_at -> Text,
    }
}

diesel::joinable!(form_questions -> forms (form_id));
diesel::joinable!(forms -> clients (client_id));
diesel::joinable!(session_series -> clients (client_id));
diesel::joinable!(sessions -> clients (client_id));
diesel::joinable!(sessions -> session_series (series_id));

diesel::allow_tables_to_appear_in_same_query!(
    clients,
    form_questions,
    forms,
    session_series,
    sessions,
);
