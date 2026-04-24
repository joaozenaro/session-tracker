import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formService } from '../services/formService';
import type { FormPayload, FormQuestionPayload } from '../types/form';

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: formService.getTemplates,
  });
}

export function useClientForms(clientId: string) {
  return useQuery({
    queryKey: ['forms', clientId],
    queryFn: () => formService.getClientForms(clientId),
  });
}

export function useFormQuestions(formId: string) {
  return useQuery({
    queryKey: ['form_questions', formId],
    queryFn: () => formService.getFormQuestions(formId),
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FormPayload) => formService.createTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useCreateClientForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, payload }: { clientId: string; payload: FormPayload }) =>
      formService.createClientForm(clientId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forms', variables.clientId] });
    },
  });
}

export function useCopyTemplateToClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, templateId }: { clientId: string; templateId: string }) =>
      formService.copyTemplateToClient(clientId, templateId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['forms', variables.clientId] });
    },
  });
}

export function useUpdateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FormPayload }) =>
      formService.updateForm(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });
}

export function useDeleteForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => formService.deleteForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ formId, payload }: { formId: string; payload: FormQuestionPayload }) =>
      formService.createQuestion(formId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['form_questions', variables.formId] });
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { formId: string; id: string; payload: FormQuestionPayload }) =>
      formService.updateQuestion(vars.id, vars.payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['form_questions', variables.formId] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { formId: string; id: string }) => formService.deleteQuestion(vars.id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['form_questions', variables.formId] });
    },
  });
}
