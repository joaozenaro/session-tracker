import { tauriInvoke } from './tauriInvoke';
import type { Form, FormPayload, FormQuestion, FormQuestionPayload } from '../types/form';

export const formService = {
  getTemplates: () => tauriInvoke<Form[]>('get_templates'),

  getClientForms: (clientIdVal: string) => tauriInvoke<Form[]>('get_client_forms', { clientIdVal }),

  createTemplate: (payload: FormPayload) => tauriInvoke<Form>('create_template', { payload }),

  createClientForm: (clientIdVal: string, payload: FormPayload) =>
    tauriInvoke<Form>('create_client_form', { clientIdVal, payload }),

  copyTemplateToClient: (clientIdVal: string, templateId: string) =>
    tauriInvoke<Form>('copy_template_to_client', { clientIdVal, templateId }),

  updateForm: (id: string, payload: FormPayload) =>
    tauriInvoke<Form>('update_form', { id, payload }),

  deleteForm: (id: string) => tauriInvoke<void>('delete_form', { id }),

  getFormQuestions: (formIdVal: string) =>
    tauriInvoke<FormQuestion[]>('get_form_questions', { formIdVal }),

  createQuestion: (formIdVal: string, payload: FormQuestionPayload) =>
    tauriInvoke<FormQuestion>('create_question', { formIdVal, payload }),

  updateQuestion: (id: string, payload: FormQuestionPayload) =>
    tauriInvoke<FormQuestion>('update_question', { id, payload }),

  deleteQuestion: (id: string) => tauriInvoke<void>('delete_question', { id }),
};
