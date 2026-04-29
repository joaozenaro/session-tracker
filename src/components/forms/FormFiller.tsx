import { useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Drawer from '@mui/material/Drawer';
import CircularProgress from '@mui/material/CircularProgress';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';

import type { Form, FormQuestion } from '../../types/form';
import { useFormQuestions, useUpdateQuestion } from '../../hooks/useForms';
import { useAppContext } from '../../lib/AppContext';
import { t } from '../../lib/i18n';
import type { Locale } from '../../lib/i18n';

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

function QuestionAnswerer({ question, locale }: { question: FormQuestion; locale: Locale }) {
  const updateQ = useUpdateQuestion();
  const [saving, setSaving] = useState(false);

  const [textVal, setTextVal] = useState(question.answer_text || '');
  const [numVal, setNumVal] = useState(question.answer_number?.toString() || '');
  const [whyNot, setWhyNot] = useState(question.answer_why_not || '');
  const [dropdownVal, setDropdownVal] = useState(question.answer_text || '');

  const [textFocused, setTextFocused] = useState(false);
  const [numFocused, setNumFocused] = useState(false);
  const [whyNotFocused, setWhyNotFocused] = useState(false);

  // Debounce timer refs
  const textDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const numDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const whyNotDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [prevText, setPrevText] = useState(question.answer_text);
  const [prevNum, setPrevNum] = useState(question.answer_number);
  const [prevWhyNot, setPrevWhyNot] = useState(question.answer_why_not);

  if (question.answer_text !== prevText && !textFocused) {
    setPrevText(question.answer_text);
    setTextVal(question.answer_text || '');
    setDropdownVal(question.answer_text || '');
  }
  if (question.answer_number !== prevNum && !numFocused) {
    setPrevNum(question.answer_number);
    setNumVal(question.answer_number?.toString() || '');
  }
  if (question.answer_why_not !== prevWhyNot && !whyNotFocused) {
    setPrevWhyNot(question.answer_why_not);
    setWhyNot(question.answer_why_not || '');
  }

  const saveChanges = async (updates: Partial<FormQuestion>) => {
    setSaving(true);
    await updateQ.mutateAsync({
      formId: question.form_id,
      id: question.id,
      payload: {
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.options,
        position: question.position,
        answer_text: question.answer_text,
        answer_yes_no: question.answer_yes_no,
        answer_why_not: question.answer_why_not,
        answer_checkbox: question.answer_checkbox,
        answer_number: question.answer_number,
        ...updates,
      },
    });
    setSaving(false);
  };

  // Debounced save helpers
  const scheduleTextSave = (val: string) => {
    if (textDebounce.current) clearTimeout(textDebounce.current);
    textDebounce.current = setTimeout(() => {
      if (val !== (question.answer_text || '')) {
        void saveChanges({ answer_text: val });
      }
    }, DEBOUNCE_MS);
  };

  const scheduleNumSave = (val: string) => {
    if (numDebounce.current) clearTimeout(numDebounce.current);
    numDebounce.current = setTimeout(() => {
      const n = parseFloat(val);
      if (!isNaN(n) && n !== question.answer_number) {
        void saveChanges({ answer_number: n });
      }
    }, DEBOUNCE_MS);
  };

  const scheduleWhyNotSave = (val: string) => {
    if (whyNotDebounce.current) clearTimeout(whyNotDebounce.current);
    whyNotDebounce.current = setTimeout(() => {
      if (val !== (question.answer_why_not || '')) {
        void saveChanges({ answer_why_not: val });
      }
    }, DEBOUNCE_MS);
  };

  // Flush on blur (saves immediately if debounce hasn't fired yet)
  const handleBlurText = () => {
    setTextFocused(false);
    if (textDebounce.current) clearTimeout(textDebounce.current);
    if (textVal !== (question.answer_text || '')) {
      void saveChanges({ answer_text: textVal });
    }
  };

  const handleBlurNum = () => {
    setNumFocused(false);
    if (numDebounce.current) clearTimeout(numDebounce.current);
    const n = parseFloat(numVal);
    if (!isNaN(n) && n !== question.answer_number) {
      void saveChanges({ answer_number: n });
    }
  };

  const handleBlurWhyNot = () => {
    setWhyNotFocused(false);
    if (whyNotDebounce.current) clearTimeout(whyNotDebounce.current);
    if (whyNot !== (question.answer_why_not || '')) {
      void saveChanges({ answer_why_not: whyNot });
    }
  };

  let options: string[] = [];
  if (question.options) {
    try {
      options = JSON.parse(question.options);
    } catch {
      // ignore
    }
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 500, flexGrow: 1 }}>
          {question.question_text}
        </Typography>
        {saving && <CircularProgress size={12} />}
      </Box>

      {question.question_type === 'text' && (
        <TextField
          size="small"
          fullWidth
          value={textVal}
          onChange={(e) => {
            setTextVal(e.target.value);
            scheduleTextSave(e.target.value);
          }}
          onFocus={() => {
            setTextFocused(true);
          }}
          onBlur={handleBlurText}
        />
      )}

      {question.question_type === 'textarea' && (
        <TextField
          size="small"
          fullWidth
          multiline
          rows={3}
          value={textVal}
          onChange={(e) => {
            setTextVal(e.target.value);
            scheduleTextSave(e.target.value);
          }}
          onFocus={() => {
            setTextFocused(true);
          }}
          onBlur={handleBlurText}
        />
      )}

      {question.question_type === 'number' && (
        <TextField
          size="small"
          type="number"
          value={numVal}
          onChange={(e) => {
            setNumVal(e.target.value);
            scheduleNumSave(e.target.value);
          }}
          onFocus={() => {
            setNumFocused(true);
          }}
          onBlur={handleBlurNum}
          sx={{ width: 200 }}
        />
      )}

      {question.question_type === 'checkbox' && (
        <FormControlLabel
          control={
            <Checkbox
              checked={!!question.answer_checkbox}
              onChange={(e) => void saveChanges({ answer_checkbox: e.target.checked })}
            />
          }
          label={t(locale, 'checked')}
        />
      )}

      {question.question_type === 'yes_no' && (
        <Box>
          <RadioGroup
            row
            value={question.answer_yes_no === null ? '' : question.answer_yes_no ? 'yes' : 'no'}
            onChange={(e) => {
              const val = e.target.value === 'yes';
              void saveChanges({ answer_yes_no: val });
            }}
          >
            <FormControlLabel value="yes" control={<Radio />} label={t(locale, 'yes')} />
            <FormControlLabel value="no" control={<Radio />} label={t(locale, 'no')} />
          </RadioGroup>
          {question.answer_yes_no === false && (
            <TextField
              size="small"
              fullWidth
              placeholder={t(locale, 'ifNotWhy')}
              value={whyNot}
              onChange={(e) => {
                setWhyNot(e.target.value);
                scheduleWhyNotSave(e.target.value);
              }}
              onFocus={() => {
                setWhyNotFocused(true);
              }}
              onBlur={handleBlurWhyNot}
              sx={{ mt: 1 }}
            />
          )}
        </Box>
      )}

      {question.question_type === 'dropdown' && (
        <Select
          size="small"
          value={dropdownVal}
          onChange={(e) => {
            setDropdownVal(e.target.value);
            void saveChanges({ answer_text: e.target.value });
          }}
          fullWidth
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
    </Box>
  );
}

interface FormFillerProps {
  form: Form;
  onClose: () => void;
  onEditStructure: () => void;
}

export default function FormFiller({ form, onClose, onEditStructure }: FormFillerProps) {
  const { locale } = useAppContext();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));
  const { data: questions = [], isLoading } = useFormQuestions(form.id);

  const sortedQuestions = [...questions].sort((a, b) => a.position - b.position);

  // Progress indicator: count answered questions
  const answeredCount = sortedQuestions.filter(isAnswered).length;
  const totalCount = sortedQuestions.length;
  const progressPct = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: isSmall ? '100vw' : 600,
          maxWidth: '100vw',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2.5,
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
          {form.title}
        </Typography>
        {/* Renamed from "Edit Form Structure" to "Edit Questions" (improvement #8) */}
        <Button size="small" startIcon={<EditIcon />} onClick={onEditStructure} sx={{ mr: 1 }}>
          {t(locale, 'editQuestions')}
        </Button>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Progress bar */}
      {!isLoading && totalCount > 0 && (
        <Box sx={{ px: 2.5, pt: 1.5, pb: 0.5 }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}
          >
            <Typography variant="caption" color="text.secondary">
              {t(locale, 'progress')}
            </Typography>
            <Chip
              label={`${answeredCount} / ${totalCount}`}
              size="small"
              color={answeredCount === totalCount ? 'success' : 'default'}
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPct}
            color={answeredCount === totalCount ? 'success' : 'primary'}
            sx={{ borderRadius: 1, height: 5 }}
          />
        </Box>
      )}

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
        {form.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {form.description}
          </Typography>
        )}

        {isLoading ? (
          <CircularProgress />
        ) : sortedQuestions.length === 0 ? (
          <Typography color="text.disabled">{t(locale, 'noQuestionsInForm')}</Typography>
        ) : (
          sortedQuestions.map((q) => <QuestionAnswerer key={q.id} question={q} locale={locale} />)
        )}
      </Box>
    </Drawer>
  );
}
