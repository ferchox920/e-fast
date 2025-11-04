'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import {
  useGetProductQuestionsQuery,
  usePostProductQuestionMutation,
} from '@/store/api/productApi';
import type { ProductQuestion } from '@/types/product';

interface ProductQuestionsProps {
  productId: string;
}

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === 'object') {
    if ('data' in err && err.data && typeof err.data === 'object') {
      const data = err.data as { detail?: unknown };
      if (typeof data.detail === 'string') return data.detail;
      if (
        Array.isArray(data.detail) &&
        data.detail.length > 0 &&
        typeof data.detail[0] === 'object' &&
        data.detail[0] &&
        'msg' in data.detail[0] &&
        typeof (data.detail[0] as { msg: unknown }).msg === 'string'
      ) {
        return String((data.detail[0] as { msg: string }).msg);
      }
    }
    if ('message' in err && typeof err.message === 'string') {
      return err.message;
    }
  }
  return fallback;
};

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export default function ProductQuestions({ productId }: ProductQuestionsProps) {
  const [questionText, setQuestionText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = useGetProductQuestionsQuery(
    { productId },
    {
      skip: !productId,
    },
  );

  const [postQuestion, { isLoading: isSubmitting }] = usePostProductQuestionMutation();

  const questions = useMemo(() => data ?? [], [data]);
  const isPending = isLoading || isFetching;

  useEffect(() => {
    if (submitStatus === 'success') {
      const timeout = setTimeout(() => setSubmitStatus('idle'), 4000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [submitStatus]);

  if (!productId) {
    return null;
  }

  const handleQuestionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setQuestionText(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = questionText.trim();
    if (!trimmed) {
      setFormError('Escribe una pregunta antes de enviar.');
      return;
    }
    setFormError(null);
    setSubmitErrorMessage(null);
    try {
      await postQuestion({
        productId,
        body: { body: trimmed },
      }).unwrap();
      setQuestionText('');
      setSubmitStatus('success');
    } catch (err) {
      setSubmitStatus('error');
      setSubmitErrorMessage(getErrorMessage(err, 'No pudimos enviar tu pregunta.'));
    }
  };

  return (
    <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-neutral-900">Preguntas y respuestas</h2>
        <p className="text-sm text-neutral-600">
          Consulta dudas a otros compradores o al equipo de soporte.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="flex flex-col gap-2 text-sm text-neutral-700">
          Haz una pregunta
          <textarea
            value={questionText}
            onChange={handleQuestionChange}
            className="min-h-[120px] rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            placeholder="Ejemplo: ¿Viene con garantía extendida?"
            maxLength={500}
            disabled={isSubmitting}
          />
        </label>

        {formError ? <p className="text-xs text-red-600">{formError}</p> : null}
        {submitStatus === 'success' ? (
          <p className="text-xs text-emerald-600">¡Tu pregunta fue enviada correctamente!</p>
        ) : null}
        {submitStatus === 'error' && submitErrorMessage ? (
          <p className="text-xs text-red-600">{submitErrorMessage}</p>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Enviando...' : 'Publicar pregunta'}
          </button>
          <span className="text-xs text-neutral-500">Requiere sesión iniciada.</span>
        </div>
      </form>

      <div className="space-y-3">
        <header className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900">
            {questions.length > 0
              ? `Preguntas (${questions.length})`
              : 'Sé el primero en preguntar'}
          </h3>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            {isError ? (
              <>
                <span>No pudimos cargar las preguntas.</span>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
                >
                  Reintentar
                </button>
              </>
            ) : null}
            {!isPending && !isError ? (
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
              >
                Actualizar
              </button>
            ) : null}
          </div>
        </header>

        {isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`question-skeleton-${index}`}
                className="space-y-2 rounded-xl border border-neutral-100 bg-neutral-50 p-4"
              >
                <div className="h-3 w-32 animate-pulse rounded bg-neutral-200" />
                <div className="h-3 w-full animate-pulse rounded bg-neutral-200" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-neutral-200" />
              </div>
            ))}
          </div>
        ) : questions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
            Aún no hay preguntas sobre este producto.
          </p>
        ) : (
          <ul className="space-y-3">
            {questions.map((question: ProductQuestion) => {
              const questionDate = formatDate(question.created_at);
              const answerDate = formatDate(question.answer?.created_at);
              return (
                <li
                  key={question.id}
                  className="space-y-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-neutral-900">{question.body}</p>
                    <p className="text-xs text-neutral-500">
                      {question.author?.full_name ?? 'Usuario anónimo'}
                      {questionDate ? ` · ${questionDate}` : null}
                    </p>
                  </div>
                  {question.answer ? (
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-neutral-700">
                      <p className="font-medium text-emerald-700">Respuesta del vendedor</p>
                      <p className="mt-1">{question.answer.body}</p>
                      <p className="mt-2 text-xs text-emerald-600">
                        {question.answer.author?.full_name ?? 'Equipo'}
                        {answerDate ? ` · ${answerDate}` : null}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-500">En espera de respuesta.</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
