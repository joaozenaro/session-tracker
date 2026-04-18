// @generated automatically by Diesel CLI.

diesel::table! {
    clients (id) {
        id -> Text,
        name -> Text,
        telephone -> Text,
        created_at -> Text,
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

diesel::joinable!(session_series -> clients (client_id));
diesel::joinable!(sessions -> clients (client_id));
diesel::joinable!(sessions -> session_series (series_id));

diesel::allow_tables_to_appear_in_same_query!(clients, session_series, sessions,);
