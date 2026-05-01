import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  TextField,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
  Breadcrumbs,
  Link,
  Stack,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragHandleIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

import {
  useTemplates,
  useFormQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useUpdateForm,
  useCreateTemplate,
} from '../hooks/useForms';
import { useAppContext } from '../lib/AppContext';
import { t } from '../lib/i18n';
import type { Locale } from '../lib/i18n';
import type { Form, FormQuestion, QuestionType } from '../types/form';

// --- UI Components ---

interface QuestionRowProps {
  question: FormQuestion;
  isSelected: boolean;
  onToggleSelect: (id: string, shiftKey: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<FormQuestion>) => void;
  locale: Locale;
  isDragging?: boolean;
  sortableProps?: {
    attributes: DraggableAttributes;
    listeners: DraggableSyntheticListeners;
    setNodeRef: (node: HTMLElement | null) => void;
    style: React.CSSProperties;
  };
}

const QuestionRow = ({
  question,
  isSelected,
  onToggleSelect,
  onDelete,
  onUpdate,
  locale,
  isDragging,
  sortableProps,
}: QuestionRowProps) => {
  return (
    <TableRow
      ref={sortableProps?.setNodeRef}
      style={sortableProps?.style}
      hover
      selected={isSelected}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button, input, select')) return;
        onToggleSelect(question.id, e.shiftKey);
      }}
      sx={{
        cursor: 'pointer',
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isDragging
          ? 'rgba(0, 0, 0, 0.05)'
          : isSelected
            ? 'rgba(25, 118, 210, 0.08)'
            : 'inherit',
      }}
    >
      <TableCell padding="checkbox">
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            size="small"
            {...sortableProps?.attributes}
            {...sortableProps?.listeners}
            sx={{ cursor: 'grab' }}
          >
            <DragHandleIcon fontSize="small" />
          </IconButton>
          <Checkbox
            size="small"
            checked={isSelected}
            onChange={(e) => onToggleSelect(question.id, (e.nativeEvent as MouseEvent).shiftKey)}
          />
        </Box>
      </TableCell>
      <TableCell sx={{ minWidth: 300, verticalAlign: 'top', py: 1 }}>
        <Stack spacing={1}>
          <TextField
            fullWidth
            variant="standard"
            size="small"
            value={question.question_text}
            onChange={(e) => onUpdate(question.id, { question_text: e.target.value })}
            placeholder={t(locale, 'questionTextPlaceholder')}
            sx={{ fontWeight: 500 }}
          />

          {(question.question_type === 'dropdown' || question.question_type === 'checkbox') && (
            <Box sx={{ ml: 1 }}>
              {(() => {
                let options: string[] = [];
                try {
                  const parsed = JSON.parse(question.options || '[]');
                  options = Array.isArray(parsed) ? parsed : [];
                } catch {
                  options = [];
                }

                return (
                  <Stack spacing={0.5}>
                    {options.map((opt, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TextField
                          fullWidth
                          variant="standard"
                          size="small"
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...options];
                            newOptions[i] = e.target.value;
                            onUpdate(question.id, { options: JSON.stringify(newOptions) });
                          }}
                          placeholder={`${t(locale, 'option')} ${i + 1}`}
                          slotProps={{ input: { sx: { fontSize: '0.75rem' } } }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => {
                            const newOptions = options.filter((_, idx) => idx !== i);
                            onUpdate(question.id, { options: JSON.stringify(newOptions) });
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      size="small"
                      startIcon={<AddIcon sx={{ fontSize: '0.8rem' }} />}
                      onClick={() => {
                        const newOptions = [...options, ''];
                        onUpdate(question.id, { options: JSON.stringify(newOptions) });
                      }}
                      sx={{
                        fontSize: '0.7rem',
                        justifyContent: 'flex-start',
                        p: 0,
                        minWidth: 0,
                        mt: 0.5,
                        textTransform: 'none',
                      }}
                    >
                      {t(locale, 'addOption')}
                    </Button>
                  </Stack>
                );
              })()}
            </Box>
          )}
        </Stack>
      </TableCell>
      <TableCell>
        <Select
          value={question.question_type}
          size="small"
          variant="standard"
          onChange={(e) => onUpdate(question.id, { question_type: e.target.value as QuestionType })}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="text">{t(locale, 'shortText')}</MenuItem>
          <MenuItem value="textarea">{t(locale, 'longText')}</MenuItem>
          <MenuItem value="number">{t(locale, 'number')}</MenuItem>
          <MenuItem value="yes_no">{t(locale, 'yesNoWithWhy')}</MenuItem>
          <MenuItem value="checkbox">{t(locale, 'checkbox')}</MenuItem>
          <MenuItem value="dropdown">{t(locale, 'dropdown')}</MenuItem>
        </Select>
      </TableCell>
      <TableCell align="right">
        <IconButton size="small" color="error" onClick={() => onDelete(question.id)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

interface SortableRowProps {
  question: FormQuestion;
  isSelected: boolean;
  onToggleSelect: (id: string, shiftKey: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<FormQuestion>) => void;
  locale: Locale;
}

function SortableRow(props: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <QuestionRow
      {...props}
      isDragging={isDragging}
      sortableProps={{ attributes, listeners, setNodeRef, style }}
    />
  );
}

// --- Main Page Component ---

export default function TemplateEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { locale } = useAppContext();

  const isNew = !id;
  const { data: templates } = useTemplates();
  const template = useMemo(() => (templates || []).find((t) => t.id === id), [templates, id]);

  const { data: initialQuestions, isLoading: loadingQuestions } = useFormQuestions(id || '-1');

  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [isLocalUpdate, setIsLocalUpdate] = useState(false);

  const [prevInitialQuestions, setPrevInitialQuestions] = useState<
    FormQuestion[] | undefined | null
  >(null);
  if (initialQuestions !== prevInitialQuestions && !isLocalUpdate) {
    setPrevInitialQuestions(initialQuestions);
    if (initialQuestions && initialQuestions.length > 0) {
      setQuestions([...initialQuestions].sort((a, b) => a.position - b.position));
    } else {
      setQuestions([]);
    }
  }

  const [prevTemplate, setPrevTemplate] = useState<Form>();
  if (template !== prevTemplate && template) {
    setPrevTemplate(template);
    setTitle(template.title);
    setDescription(template.description);
  }

  const createTemplate = useCreateTemplate();
  const updateForm = useUpdateForm();
  const createQ = useCreateQuestion();
  const updateQ = useUpdateQuestion();
  const deleteQ = useDeleteQuestion();

  const handleToggleSelect = useCallback(
    (id: string, shiftKey: boolean) => {
      const index = questions.findIndex((q) => q.id === id);
      if (index === -1) return;

      const newSelected = new Set(selectedIds);

      if (shiftKey && lastSelectedIndex !== null) {
        const start = Math.min(index, lastSelectedIndex);
        const end = Math.max(index, lastSelectedIndex);
        for (let i = start; i <= end; i++) {
          newSelected.add(questions[i].id);
        }
      } else {
        if (newSelected.has(id)) {
          newSelected.delete(id);
        } else {
          newSelected.add(id);
        }
        setLastSelectedIndex(index);
      }
      setSelectedIds(newSelected);
    },
    [questions, selectedIds, lastSelectedIndex]
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(questions.map((q) => q.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleUpdateLocalQuestion = (id: string, updates: Partial<FormQuestion>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const handleAddQuestion = async () => {
    if (!id) {
      const newT = await createTemplate.mutateAsync({
        title: title || t(locale, 'newTemplateDefault'),
        description,
      });

      // Also create the first question immediately for a better QoL flow
      await createQ.mutateAsync({
        formId: newT.id,
        payload: {
          question_text: '',
          question_type: 'text',
          options: null,
          position: 0,
          answer_text: null,
          answer_yes_no: null,
          answer_why_not: null,
          answer_checkbox: null,
          answer_number: null,
        },
      });

      navigate(`/templates/edit/${newT.id}`, { replace: true });
      return;
    }

    const newPosition = questions.length;
    await createQ.mutateAsync({
      formId: id,
      payload: {
        question_text: '',
        question_type: 'text',
        options: null,
        position: newPosition,
        answer_text: null,
        answer_yes_no: null,
        answer_why_not: null,
        answer_checkbox: null,
        answer_number: null,
      },
    });
  };

  const handleDeleteSelected = async () => {
    if (!id || selectedIds.size === 0) return;
    if (!confirm(t(locale, 'deleteQuestionConfirm'))) return;

    for (const qId of selectedIds) {
      await deleteQ.mutateAsync({ formId: id, id: qId });
    }
    setSelectedIds(new Set());
  };

  const handleSaveForm = async () => {
    if (!title.trim()) return;
    if (isNew) {
      const newT = await createTemplate.mutateAsync({ title, description });
      navigate(`/templates/edit/${newT.id}`);
    } else if (id) {
      await updateForm.mutateAsync({ id, payload: { title, description } });
      const currentInitial = initialQuestions || [];
      for (const q of questions) {
        const original = currentInitial.find((oq) => oq.id === q.id);
        if (
          original &&
          (original.question_text !== q.question_text || original.question_type !== q.question_type)
        ) {
          await updateQ.mutateAsync({ formId: id, id: q.id, payload: q });
        }
      }
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setIsLocalUpdate(true);
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      const newQuestions = arrayMove(questions, oldIndex, newIndex);
      setQuestions(newQuestions);

      if (id) {
        try {
          for (let i = 0; i < newQuestions.length; i++) {
            const q = newQuestions[i];
            if (q.position !== i) {
              await updateQ.mutateAsync({
                formId: id,
                id: q.id,
                payload: { ...q, position: i },
              });
            }
          }
        } finally {
          // Allow sync again after a short delay to let refetches settle
          setTimeout(() => {
            setIsLocalUpdate(false);
          }, 500);
        }
      } else {
        setIsLocalUpdate(false);
      }
    }
  };

  const activeQuestion = useMemo(
    () => questions.find((q) => q.id === activeId),
    [questions, activeId]
  );

  if (!isNew && !template && !loadingQuestions) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>{t(locale, 'templateNotFound')}</Typography>
        <Button onClick={() => navigate('/templates')}>{t(locale, 'goBack')}</Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Paper
        sx={{
          px: 3,
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
          borderRadius: 0,
          zIndex: 1100,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={() => navigate('/templates')}>
            <ArrowBackIcon />
          </IconButton>
          <Breadcrumbs>
            <Link
              underline="hover"
              color="inherit"
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate('/templates')}
            >
              {t(locale, 'templates')}
            </Link>
            <Typography color="text.primary">
              {isNew ? t(locale, 'createTemplate') : t(locale, 'editTemplateLabel')}
            </Typography>
          </Breadcrumbs>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveForm}
            disableElevation
            disabled={!title.trim() || updateForm.isPending || createTemplate.isPending}
          >
            {t(locale, 'save')}
          </Button>
        </Stack>
      </Paper>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 4 }}>
        <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
          <Paper variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Stack spacing={3}>
              <TextField
                label={t(locale, 'templateTitle')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                variant="outlined"
              />
              <TextField
                label={t(locale, 'description')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={2}
                variant="outlined"
              />
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, flexGrow: 1 }}>
                {t(locale, 'questions')} ({questions.length})
              </Typography>

              {selectedIds.size > 0 && (
                <Stack direction="row" spacing={1} sx={{ mr: 2 }}>
                  <Typography variant="caption" sx={{ alignSelf: 'center', mr: 1 }}>
                    {selectedIds.size} {t(locale, 'selected')}
                  </Typography>
                  <Tooltip title={t(locale, 'deleteSelected')}>
                    <IconButton size="small" color="error" onClick={handleDeleteSelected}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              )}

              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddQuestion}
              >
                {t(locale, 'addQuestion')}
              </Button>
            </Box>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          indeterminate={
                            selectedIds.size > 0 && selectedIds.size < questions.length
                          }
                          checked={questions.length > 0 && selectedIds.size === questions.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </TableCell>
                      <TableCell>{t(locale, 'questionText')}</TableCell>
                      <TableCell>{t(locale, 'type')}</TableCell>
                      <TableCell align="right">{t(locale, 'actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <SortableContext
                      items={questions.map((q) => q.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {questions.map((q) => (
                        <SortableRow
                          key={q.id}
                          question={q}
                          isSelected={selectedIds.has(q.id)}
                          onToggleSelect={handleToggleSelect}
                          onDelete={(qId) => {
                            if (confirm(t(locale, 'deleteQuestionConfirm'))) {
                              if (id) deleteQ.mutate({ formId: id, id: qId });
                            }
                          }}
                          onUpdate={handleUpdateLocalQuestion}
                          locale={locale}
                        />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
              </TableContainer>
              <DragOverlay
                dropAnimation={{
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: { active: { opacity: '0.5' } },
                  }),
                }}
              >
                {activeId ? (
                  <Table sx={{ width: '100%', bgcolor: 'background.paper', boxShadow: 10 }}>
                    <TableBody>
                      <QuestionRow
                        question={activeQuestion!}
                        isSelected={selectedIds.has(activeId as string)}
                        onToggleSelect={() => {}}
                        onDelete={() => {}}
                        onUpdate={() => {}}
                        locale={locale}
                      />
                    </TableBody>
                  </Table>
                ) : null}
              </DragOverlay>
            </DndContext>

            {loadingQuestions && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {questions.length === 0 && !loadingQuestions && (
              <Box sx={{ p: 4, textAlign: 'center', color: 'text.disabled' }}>
                <Typography variant="body2">{t(locale, 'noQuestionsYet')}</Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
