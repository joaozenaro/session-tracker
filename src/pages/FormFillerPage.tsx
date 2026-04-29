import { useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Button,
  Stack,
  LinearProgress,
  TextField,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Select,
  MenuItem,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
} from '@mui/icons-material';

import { useFormQuestions, useUpdateQuestion } from '../hooks/useForms';
import { useAppContext } from '../lib/AppContext';
import { t } from '../lib/i18n';
import type { Locale } from '../lib/i18n';
import type { FormQuestion } from '../types/form';

const DEBOUNCE_MS = 800;

function isAnswered(q: FormQuestion): boolean {
  switch (q.question_type) {
    case 'text':
    case 'textarea':
    case 'dropdown':
      return q.answer_text !== null && q.answer_text !== '';
    case 'number':
      return q.answer_number !== null;
    case 'yes_no':
      return q.answer_yes_no !== null;
    case 'checkbox':
      return q.answer_checkbox !== null;
    default:
      return false;
  }
}

// --- Focused Question Component ---

function FocusedQuestion({ question, locale }: { question: FormQuestion; locale: Locale }) {
  const updateQ = useUpdateQuestion();
  const [saving, setSaving] = useState(false);

  const [textVal, setTextVal] = useState(question.answer_text || '');
  const [numVal, setNumVal] = useState(question.answer_number?.toString() || '');
  const [whyNot, setWhyNot] = useState(question.answer_why_not || '');
  const [dropdownVal, setDropdownVal] = useState(question.answer_text || '');

  const [textFocused, setTextFocused] = useState(false);

  const textDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [prevAnswerText, setPrevAnswerText] = useState(question.answer_text);

  if (question.answer_text !== prevAnswerText && !textFocused) {
    setPrevAnswerText(question.answer_text);
    setTextVal(question.answer_text || '');
    setDropdownVal(question.answer_text || '');
  }

  const saveChanges = async (updates: Partial<FormQuestion>) => {
    setSaving(true);
    await updateQ.mutateAsync({
      formId: question.form_id,
      id: question.id,
      payload: { ...question, ...updates },
    });
    setSaving(false);
  };

  const scheduleTextSave = (val: string) => {
    if (textDebounce.current) clearTimeout(textDebounce.current);
    textDebounce.current = setTimeout(() => {
      if (val !== (question.answer_text || '')) {
        void saveChanges({ answer_text: val });
      }
    }, DEBOUNCE_MS);
  };

  let options: string[] = [];
  if (question.options) {
    try {
      options = JSON.parse(question.options);
    } catch {
      /* ignore */
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, mb: 4 }}>
      <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, flexGrow: 1 }}>
          {question.question_text}
        </Typography>
        {saving && <CircularProgress size={16} />}
        {isAnswered(question) && !saving && <CheckCircleIcon color="success" fontSize="small" />}
      </Stack>

      {question.question_type === 'text' && (
        <TextField
          fullWidth
          variant="filled"
          value={textVal}
          onChange={(e) => {
            setTextVal(e.target.value);
            scheduleTextSave(e.target.value);
          }}
          onFocus={() => {
            setTextFocused(true);
          }}
          onBlur={() => {
            setTextFocused(false);
            if (textVal !== (question.answer_text || ''))
              void saveChanges({ answer_text: textVal });
          }}
          placeholder={t(locale, 'typeAnswerHere')}
        />
      )}

      {question.question_type === 'textarea' && (
        <TextField
          fullWidth
          multiline
          rows={6}
          variant="filled"
          value={textVal}
          onChange={(e) => {
            setTextVal(e.target.value);
            scheduleTextSave(e.target.value);
          }}
          onFocus={() => {
            setTextFocused(true);
          }}
          onBlur={() => {
            setTextFocused(false);
            if (textVal !== (question.answer_text || ''))
              void saveChanges({ answer_text: textVal });
          }}
          placeholder={t(locale, 'typeAnswerHere')}
        />
      )}

      {question.question_type === 'number' && (
        <TextField
          type="number"
          variant="filled"
          value={numVal}
          onChange={(e) => {
            setNumVal(e.target.value);
            const n = parseFloat(e.target.value);
            if (!isNaN(n)) void saveChanges({ answer_number: n });
          }}
          sx={{ maxWidth: 200 }}
        />
      )}

      {question.question_type === 'checkbox' && (
        <FormControlLabel
          control={
            <Checkbox
              checked={!!question.answer_checkbox}
              onChange={(e) => void saveChanges({ answer_checkbox: e.target.checked })}
              sx={{ '& .MuiSvgIcon-root': { fontSize: 32 } }}
            />
          }
          label={t(locale, 'checked')}
        />
      )}

      {question.question_type === 'yes_no' && (
        <Box>
          <RadioGroup
            value={question.answer_yes_no === null ? '' : question.answer_yes_no ? 'yes' : 'no'}
            onChange={(e) => void saveChanges({ answer_yes_no: e.target.value === 'yes' })}
          >
            <FormControlLabel value="yes" control={<Radio />} label={t(locale, 'yes')} />
            <FormControlLabel value="no" control={<Radio />} label={t(locale, 'no')} />
          </RadioGroup>
          {question.answer_yes_no === false && (
            <TextField
              fullWidth
              variant="standard"
              placeholder={t(locale, 'ifNotWhy')}
              value={whyNot}
              onChange={(e) => setWhyNot(e.target.value)}
              onBlur={() => void saveChanges({ answer_why_not: whyNot })}
              sx={{ mt: 2 }}
            />
          )}
        </Box>
      )}

      {question.question_type === 'dropdown' && (
        <Select
          fullWidth
          variant="filled"
          value={dropdownVal}
          onChange={(e) => void saveChanges({ answer_text: e.target.value })}
          displayEmpty
        >
          <MenuItem value="">
            <em>{t(locale, 'none')}</em>
          </MenuItem>
          {options.map((opt, i) => (
            <MenuItem key={i} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </Select>
      )}
    </Paper>
  );
}

// --- Main Page Component ---

export default function FormFillerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { locale } = useAppContext();

  const { data: questions = [], isLoading: loadingQuestions } = useFormQuestions(id || '-1');
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.position - b.position),
    [questions]
  );

  // Initialize active question when data loads
  const [prevSortedQuestions, setPrevSortedQuestions] = useState(sortedQuestions);
  if (sortedQuestions !== prevSortedQuestions && sortedQuestions.length > 0 && !activeQuestionId) {
    setPrevSortedQuestions(sortedQuestions);
    setActiveQuestionId(sortedQuestions[0].id);
  }

  const activeQuestion = useMemo(
    () => sortedQuestions.find((q) => q.id === activeQuestionId),
    [sortedQuestions, activeQuestionId]
  );

  const answeredCount = sortedQuestions.filter(isAnswered).length;
  const totalCount = sortedQuestions.length;
  const progressPct = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  if (loadingQuestions) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar Navigation */}
      <Paper
        sx={{
          width: 300,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
          borderRight: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mb: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            {t(locale, 'formProgress')}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progressPct}
            sx={{ height: 8, borderRadius: 4, mb: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            {answeredCount} of {totalCount} {t(locale, 'answered')}
          </Typography>
        </Box>
        <List sx={{ flexGrow: 1, overflowY: 'auto', py: 0 }}>
          {sortedQuestions.map((q, idx) => (
            <ListItem key={q.id} disablePadding>
              <ListItemButton
                selected={activeQuestionId === q.id}
                onClick={() => setActiveQuestionId(q.id)}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {isAnswered(q) ? (
                    <CheckCircleIcon color="success" fontSize="small" />
                  ) : (
                    <UncheckedIcon fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={`${idx + 1}. ${q.question_text || t(locale, 'untitledQuestion')}`}
                  primaryTypographyProps={{
                    noWrap: true,
                    variant: 'body2',
                    fontWeight: activeQuestionId === q.id ? 700 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 6 }}>
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          {activeQuestion ? (
            <FocusedQuestion key={activeQuestion.id} question={activeQuestion} locale={locale} />
          ) : (
            <Box sx={{ textAlign: 'center', mt: 8 }}>
              <Typography color="text.disabled">{t(locale, 'noQuestionsInForm')}</Typography>
            </Box>
          )}

          {/* Navigation buttons */}
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
            <Button
              disabled={!activeQuestion || sortedQuestions.indexOf(activeQuestion) === 0}
              onClick={() => {
                const idx = sortedQuestions.indexOf(activeQuestion!);
                setActiveQuestionId(sortedQuestions[idx - 1].id);
              }}
            >
              {t(locale, 'previous')}
            </Button>
            <Button
              variant="contained"
              disabled={
                !activeQuestion || sortedQuestions.indexOf(activeQuestion) === totalCount - 1
              }
              onClick={() => {
                const idx = sortedQuestions.indexOf(activeQuestion!);
                setActiveQuestionId(sortedQuestions[idx + 1].id);
              }}
            >
              {t(locale, 'next')}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
