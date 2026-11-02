'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useGetPendingProductQuestionsQuery } from '@/store/api/adminApi';
import {
  useAnswerProductQuestionMutation,
  useSetProductQuestionBlockMutation,
} from '@/store/api/productApi';

const QUESTIONS_LIMIT = 50;

type FeedbackState = Record<string, string | undefined>;

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const toErrorMessage = (error: unknown) => {
  if (!error) return 'No se pudo completar la accion.';
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const data = (error as { data?: unknown }).data;
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object') {
      if ('detail' in data && typeof (data as { detail?: unknown }).detail === 'string') {
        return (data as { detail: string }).detail;
      }
      if ('message' in data && typeof (data as { message?: unknown }).message === 'string') {
        return (data as { message: string }).message;
      }
    }
  }
  return 'No se pudo completar la accion.';
};

export default function AdminQuestionsPage() {
  const { data, isLoading, isFetching, isError, refetch } = useGetPendingProductQuestionsQuery({
    limit: QUESTIONS_LIMIT,
  });
  const [answerQuestion, answerState] = useAnswerProductQuestionMutation();
  const [blockQuestion, blockState] = useSetProductQuestionBlockMutation();

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<FeedbackState>({});
  const [errorFeedback, setErrorFeedback] = useState<FeedbackState>({});

  const questions = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? questions.length;
  const isMutating = answerState.isLoading || blockState.isLoading;
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const productOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const question of questions) {
      const id = String(question.product_id);
      const label = question.product_title?.trim() || `Producto ${id}`;
      if (!map.has(id)) {
        map.set(id, label);
      }
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      if (productFilter && String(question.product_id) !== productFilter) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        question.product_title ?? '',
        question.author_name ?? '',
        question.body ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [questions, productFilter, normalizedSearch]);

  const handleDraftChange = (id: string, nextValue: string) => {
    setDrafts((prev) => ({ ...prev, [id]: nextValue }));
    setErrorFeedback((prev) => ({ ...prev, [id]: undefined }));
    setSuccessFeedback((prev) => ({ ...prev, [id]: undefined }));
  };

  const handleAnswer = async (questionId: string) => {
    const content = (drafts[questionId] ?? '').trim();
    if (!content) {
      setErrorFeedback((prev) => ({
        ...prev,
        [questionId]: 'Escribe una respuesta antes de enviar.',
      }));
      return;
    }

    setPendingId(questionId);
    setErrorFeedback((prev) => ({ ...prev, [questionId]: undefined }));
    setSuccessFeedback((prev) => ({ ...prev, [questionId]: undefined }));

    try {
      await answerQuestion({
        questionId,
        body: { content },
      }).unwrap();
      setDrafts((prev) => ({ ...prev, [questionId]: '' }));
      setSuccessFeedback((prev) => ({ ...prev, [questionId]: 'Respuesta enviada.' }));
    } catch (error) {
      setErrorFeedback((prev) => ({ ...prev, [questionId]: toErrorMessage(error) }));
    } finally {
      setPendingId(null);
    }
  };

  const handleBlock = async (questionId: string) => {
    setPendingId(questionId);
    setErrorFeedback((prev) => ({ ...prev, [questionId]: undefined }));
    setSuccessFeedback((prev) => ({ ...prev, [questionId]: undefined }));

    try {
      await blockQuestion({
        questionId,
        body: { is_blocked: true, reason: 'Moderado por administrador' },
      }).unwrap();
      setSuccessFeedback((prev) => ({ ...prev, [questionId]: 'Pregunta bloqueada.' }));
    } catch (error) {
      setErrorFeedback((prev) => ({ ...prev, [questionId]: toErrorMessage(error) }));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Moderacion de preguntas</h1>
          <p className="text-sm text-neutral-600">
            Responde o bloquea preguntas pendientes sin salir de este modulo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex h-9 items-center rounded-lg border border-neutral-300 px-3 text-sm font-semibold text-neutral-700 hover:border-neutral-400 disabled:opacity-60"
        >
          {isFetching ? 'Actualizando...' : 'Actualizar'}
        </button>
      </header>

      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr,220px]">
          <label className="text-sm text-neutral-600">
            Buscar
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Producto, cliente o pregunta..."
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
          <label className="text-sm text-neutral-600">
            Producto
            <select
              value={productFilter}
              onChange={(event) => setProductFilter(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">Todos</option>
              {productOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-3 text-sm text-neutral-600">
          Mostrando <span className="font-semibold text-neutral-900">{filteredQuestions.length}</span>{' '}
          de <span className="font-semibold text-neutral-900">{total}</span> pendientes.
        </p>
      </section>

      {isError ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          No se pudieron cargar las preguntas pendientes.
        </section>
      ) : null}

      <section className="space-y-3">
        {isLoading ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500">
            Cargando preguntas...
          </div>
        ) : null}

        {!isLoading && !questions.length ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
            No hay preguntas pendientes por moderar.
          </div>
        ) : null}

        {!isLoading && !!questions.length && !filteredQuestions.length ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
            No hay resultados para los filtros aplicados.
          </div>
        ) : null}

        {filteredQuestions.map((question) => {
          const questionId = String(question.id);
          const draft = drafts[questionId] ?? '';
          const rowPending = isMutating && pendingId === questionId;

          return (
            <article
              key={questionId}
              className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-neutral-900">
                  {question.product_title ?? 'Producto sin titulo'}
                </p>
                <p className="text-xs text-neutral-500">
                  {question.author_name ?? 'Anonimo'} | {formatDateTime(question.created_at)}
                </p>
              </div>

              <p className="mt-2 text-sm text-neutral-700">{question.body}</p>

              <textarea
                value={draft}
                onChange={(event) => handleDraftChange(questionId, event.target.value)}
                placeholder="Escribe una respuesta para el cliente"
                className="mt-3 min-h-[90px] w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                disabled={rowPending}
              />

              {errorFeedback[questionId] ? (
                <p className="mt-2 text-xs text-rose-600">{errorFeedback[questionId]}</p>
              ) : null}
              {successFeedback[questionId] ? (
                <p className="mt-2 text-xs text-emerald-600">{successFeedback[questionId]}</p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/admin/products/${question.product_id}/edit?tab=questions`}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Ver producto
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBlock(questionId)}
                    disabled={rowPending}
                    className="inline-flex h-8 items-center rounded-md border border-rose-300 px-3 text-xs font-semibold text-rose-700 disabled:opacity-60"
                  >
                    {rowPending && blockState.isLoading ? 'Bloqueando...' : 'Bloquear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAnswer(questionId)}
                    disabled={rowPending}
                    className="inline-flex h-8 items-center rounded-md bg-indigo-600 px-3 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {rowPending && answerState.isLoading ? 'Enviando...' : 'Responder'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
