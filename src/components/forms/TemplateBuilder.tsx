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
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Alert from '@mui/material/Alert';

import type { Form, FormQuestion, QuestionType } from '../../types/form';
import {
  useCreateTemplate,
  useUpdateForm,
  useFormQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
} from '../../hooks/useForms';
import { useAppContext } from '../../lib/AppContext';
import { t } from '../../lib/i18n';

interface TemplateBuilderProps {
  open: boolean;
  template: Form | null;
  onClose: () => void;
}

const getQuestionTypes = (locale: any) => [
  { value: 'text', label: t(locale, 'shortText') },
  { value: 'textarea', label: t(locale, 'longText') },
  { value: 'number', label: t(locale, 'number') },
  { value: 'yes_no', label: t(locale, 'yesNoWithWhy') },
  { value: 'checkbox', label: t(locale, 'checkbox') },
  { value: 'dropdown', label: t(locale, 'dropdown') },
];

function QuestionEditor({
  question,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  locale,
}: {
  question: FormQuestion;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  locale: any;
}) {
  const [text, setText] = useState(question.question_text);
  const [type, setType] = useState<QuestionType>(question.question_type);
  const [optionsStr, setOptionsStr] = useState(() => {
    if (!question.options) return '';
    try {
      return (JSON.parse(question.options) as string[]).join('\n');
    } catch {
      return question.options;
    }
  });

  const updateQ = useUpdateQuestion();

  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    let finalOptions: string | null = null;
    if (type === 'dropdown') {
      const opts = optionsStr
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      finalOptions = JSON.stringify(opts);
    }
    await updateQ.mutateAsync({
      formId: question.form_id,
      id: question.id,
      payload: {
        question_text: text,
        question_type: type,
        options: finalOptions,
        position: question.position,
        answer_text: null,
        answer_yes_no: null,
        answer_why_not: null,
        answer_checkbox: null,
        answer_number: null,
      },
    });
    setIsEditing(false);
  };

  // Improvement: Enter key in the text field triggers save
  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSave();
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: isEditing ? 2 : 0 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', mr: 2 }}>
          <IconButton size="small" onClick={onMoveUp} disabled={isFirst}>
            <KeyboardArrowUpIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onMoveDown} disabled={isLast}>
            <KeyboardArrowDownIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          {isEditing ? (
            <TextField
              size="small"
              fullWidth
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleTextKeyDown}
              placeholder={t(locale, 'questionTextPlaceholder')}
              autoFocus
            />
          ) : (
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {question.question_text || t(locale, 'untitledQuestion')}
            </Typography>
          )}
        </Box>
        {!isEditing && (
          <Button size="small" onClick={() => setIsEditing(true)}>
            {t(locale, 'edit')}
          </Button>
        )}
        <IconButton size="small" color="error" onClick={onDelete}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>

      {isEditing && (
        <Box sx={{ ml: 5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Select
            size="small"
            value={type}
            onChange={(e) => setType(e.target.value as QuestionType)}
            fullWidth
          >
            {getQuestionTypes(locale).map((qt) => (
              <MenuItem key={qt.value} value={qt.value}>
                {qt.label}
              </MenuItem>
            ))}
          </Select>

          {type === 'dropdown' && (
            <TextField
              label={t(locale, 'optionsPerLine')}
              multiline
              rows={3}
              value={optionsStr}
              onChange={(e) => setOptionsStr(e.target.value)}
              size="small"
              fullWidth
            />
          )}

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={() => void handleSave()}
              disabled={updateQ.isPending}
              disableElevation
            >
              {updateQ.isPending ? t(locale, 'saving') : t(locale, 'saveQuestion')}
            </Button>
            <Button size="small" onClick={() => setIsEditing(false)}>
              {t(locale, 'cancel')}
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
}

export default function TemplateBuilder({ open, template, onClose }: TemplateBuilderProps) {
  const { locale } = useAppContext();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('md'));

  // Bug #6: Keep internal currentTemplate so we can switch to edit mode after creation
  // without closing the drawer.
  const [currentTemplate, setCurrentTemplate] = useState<Form | null>(template);

  const [title, setTitle] = useState(template?.title ?? '');
  const [description, setDescription] = useState(template?.description ?? '');

  const createTemplate = useCreateTemplate();
  const updateForm = useUpdateForm();

  const isNew = !currentTemplate;

  const { data: questions = [], isLoading: loadingQs } = useFormQuestions(
    currentTemplate?.id || '-1',
  );
  const createQ = useCreateQuestion();
  const updateQ = useUpdateQuestion();
  const deleteQ = useDeleteQuestion();

  // Bug #2: Prevent concurrent reorder mutations (race condition guard)
  const isReordering = useRef(false);

  const handleSaveForm = async () => {
    if (!title.trim()) return;
    if (isNew) {
      // Bug #6 fix: don't close — switch to edit mode with the newly created template
      const newTemplate = await createTemplate.mutateAsync({ title, description });
      setCurrentTemplate(newTemplate);
    } else {
      await updateForm.mutateAsync({ id: currentTemplate.id, payload: { title, description } });
      onClose();
    }
  };

  const handleAddQuestion = async () => {
    if (!currentTemplate) return;
    await createQ.mutateAsync({
      formId: currentTemplate.id,
      payload: {
        question_text: t(locale, 'untitledQuestion'),
        question_type: 'text',
        options: null,
        position: questions.length,
        answer_text: null,
        answer_yes_no: null,
        answer_why_not: null,
        answer_checkbox: null,
        answer_number: null,
      },
    });
  };

  const handleDeleteQuestion = async (q: FormQuestion) => {
    if (!confirm(t(locale, 'deleteQuestionConfirm'))) return;
    await deleteQ.mutateAsync({ formId: currentTemplate!.id, id: q.id });
  };

  const handleMoveQuestion = async (q: FormQuestion, direction: -1 | 1) => {
    // Bug #2 fix: prevent double-firing when user clicks quickly
    if (isReordering.current) return;
    isReordering.current = true;

    try {
      const sorted = [...questions].sort((a, b) => a.position - b.position);
      const currentIndex = sorted.findIndex((x) => x.id === q.id);
      const targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= sorted.length) return;

      const newOrder = [...sorted];
      const temp = newOrder[currentIndex];
      newOrder[currentIndex] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;

      // Update incrementally to prevent SQLite database locks from parallel writes,
      // and naturally fix any duplicate positions by strictly using the array index.
      for (let i = 0; i < newOrder.length; i++) {
        const item = newOrder[i];
        if (item.position !== i) {
          await updateQ.mutateAsync({
            formId: currentTemplate!.id,
            id: item.id,
            payload: {
              question_text: item.question_text,
              question_type: item.question_type,
              options: item.options,
              position: i,
              answer_text: item.answer_text,
              answer_yes_no: item.answer_yes_no,
              answer_why_not: item.answer_why_not,
              answer_checkbox: item.answer_checkbox,
              answer_number: item.answer_number,
            },
          });
        }
      }
    } finally {
      isReordering.current = false;
    }
  };

  // Sort by position
  const sortedQuestions = [...questions].sort((a, b) => a.position - b.position);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: isSmall ? '100vw' : 500,
          maxWidth: '100vw',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
          {isNew ? t(locale, 'createTemplate') : t(locale, 'editTemplateLabel')}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label={t(locale, 'templateTitle')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label={t(locale, 'description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
          />
          <Button
            variant="contained"
            onClick={() => void handleSaveForm()}
            disabled={!title.trim() || createTemplate.isPending || updateForm.isPending}
            disableElevation
          >
            {createTemplate.isPending || updateForm.isPending
              ? t(locale, 'saving')
              : t(locale, 'saveTemplateDetails')}
          </Button>
        </Box>

        <Divider />

        {!isNew && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '1rem' }}>
                {t(locale, 'questions')}
              </Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={() => void handleAddQuestion()}>
                {t(locale, 'addQuestion')}
              </Button>
            </Box>

            {loadingQs ? (
              <CircularProgress size={24} />
            ) : sortedQuestions.length === 0 ? (
              <Alert severity="info">{t(locale, 'noQuestionsYet')}</Alert>
            ) : (
              sortedQuestions.map((q, idx) => (
                <QuestionEditor
                  key={q.id}
                  question={q}
                  onDelete={() => void handleDeleteQuestion(q)}
                  onMoveUp={() => void handleMoveQuestion(q, -1)}
                  onMoveDown={() => void handleMoveQuestion(q, 1)}
                  isFirst={idx === 0}
                  isLast={idx === sortedQuestions.length - 1}
                  locale={locale}
                />
              ))
            )}
          </Box>
        )}

        {/* Bug #6 fix: this alert now only shows briefly before creation resolves */}
        {isNew && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {t(locale, 'saveTemplateFirst')}
          </Alert>
        )}
      </Box>
    </Drawer>
  );
}
