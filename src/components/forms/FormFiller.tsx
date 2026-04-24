import { useState } from 'react';
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
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

import type { Form, FormQuestion } from '../../types/form';
import { useFormQuestions, useUpdateQuestion } from '../../hooks/useForms';
import { useAppContext } from '../../lib/AppContext';
import { t } from '../../lib/i18n';

function QuestionAnswerer({ question, locale }: { question: FormQuestion; locale: any }) {
  const updateQ = useUpdateQuestion();
  const [saving, setSaving] = useState(false);

  // Local state for debouncing
  const [textVal, setTextVal] = useState(question.answer_text || '');
  const [numVal, setNumVal] = useState(question.answer_number?.toString() || '');
  const [whyNot, setWhyNot] = useState(question.answer_why_not || '');

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

  const handleBlurText = () => {
    if (textVal !== (question.answer_text || '')) {
      saveChanges({ answer_text: textVal });
    }
  };

  const handleBlurNum = () => {
    const n = parseFloat(numVal);
    if (!isNaN(n) && n !== question.answer_number) {
      saveChanges({ answer_number: n });
    }
  };

  const handleBlurWhyNot = () => {
    if (whyNot !== (question.answer_why_not || '')) {
      saveChanges({ answer_why_not: whyNot });
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
      <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
        {question.question_text} {saving && <CircularProgress size={12} sx={{ ml: 1 }} />}
      </Typography>

      {question.question_type === 'text' && (
        <TextField
          size="small"
          fullWidth
          value={textVal}
          onChange={(e) => setTextVal(e.target.value)}
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
          onChange={(e) => setTextVal(e.target.value)}
          onBlur={handleBlurText}
        />
      )}

      {question.question_type === 'number' && (
        <TextField
          size="small"
          type="number"
          value={numVal}
          onChange={(e) => setNumVal(e.target.value)}
          onBlur={handleBlurNum}
          sx={{ width: 200 }}
        />
      )}

      {question.question_type === 'checkbox' && (
        <FormControlLabel
          control={
            <Checkbox
              checked={!!question.answer_checkbox}
              onChange={(e) => saveChanges({ answer_checkbox: e.target.checked })}
            />
          }
          label={t(locale, 'yes')}
        />
      )}

      {question.question_type === 'yes_no' && (
        <Box>
          <RadioGroup
            row
            value={question.answer_yes_no === null ? '' : question.answer_yes_no ? 'yes' : 'no'}
            onChange={(e) => {
              const val = e.target.value === 'yes';
              saveChanges({ answer_yes_no: val });
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
              onChange={(e) => setWhyNot(e.target.value)}
              onBlur={handleBlurWhyNot}
              sx={{ mt: 1 }}
            />
          )}
        </Box>
      )}

      {question.question_type === 'dropdown' && (
        <Select
          size="small"
          value={textVal}
          onChange={(e) => {
            setTextVal(e.target.value);
            saveChanges({ answer_text: e.target.value });
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
        <Button size="small" onClick={onEditStructure} sx={{ mr: 1 }}>
          {t(locale, 'editFormStructure')}
        </Button>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

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
