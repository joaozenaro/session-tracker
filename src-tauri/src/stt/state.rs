use serde::Serialize;

/// Keeps track of what text has been "confirmed" (stable) vs "unstable"
/// by diffing successive inference outputs word-by-word.
#[derive(Default, Clone, Serialize)]
pub struct TranscriptionState {
    pub confirmed: String,
    pub unstable: String,
    previous_full: String,
}

impl TranscriptionState {
    /// Update state from a new full inference result.
    /// Splits at the first word that differs from the previous run.
    pub fn update(&mut self, new_text: String) {
        let prev_words: Vec<&str> = self.previous_full.split_whitespace().collect();
        let new_words: Vec<&str> = new_text.split_whitespace().collect();

        // Find the longest common prefix
        let common_len = prev_words
            .iter()
            .zip(new_words.iter())
            .take_while(|(a, b)| a == b)
            .count();

        // Words that have appeared identically in the previous run are "confirmed"
        let stable_words: Vec<&str> = new_words[..common_len].to_vec();
        let unstable_words: Vec<&str> = new_words[common_len..].to_vec();

        self.confirmed = stable_words.join(" ");
        self.unstable = unstable_words.join(" ");
        self.previous_full = new_text;
    }

    /// Reset on new recording session.
    pub fn reset(&mut self) {
        self.confirmed.clear();
        self.unstable.clear();
        self.previous_full.clear();
    }
}
