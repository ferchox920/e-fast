import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '@/store';
import { productApi } from '@/store/api/productApi';
import type { ProductQuestion } from '@/types/product';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface ProductQuestionsState {
  selectedProductId: string | null;
  itemsByProduct: Record<string, ProductQuestion[]>;
  listStatus: RequestStatus;
  mutationStatus: RequestStatus;
  error: string | null;
}

const initialState: ProductQuestionsState = {
  selectedProductId: null,
  itemsByProduct: {},
  listStatus: 'idle',
  mutationStatus: 'idle',
  error: null,
};

const upsertQuestion = (items: ProductQuestion[], question: ProductQuestion): ProductQuestion[] => {
  const questionId = String(question.id);
  const next = [...items];
  const index = next.findIndex((item) => String(item.id) === questionId);
  if (index >= 0) {
    next[index] = question;
  } else {
    next.unshift(question);
  }
  return next;
};

const setQuestionsForProduct = (
  state: ProductQuestionsState,
  productId: string,
  items: ProductQuestion[],
) => {
  state.itemsByProduct[productId] = items;
  state.selectedProductId = productId;
};

const setMutationSuccess = (state: ProductQuestionsState, question: ProductQuestion) => {
  const productId = String(question.product_id);
  const existing = state.itemsByProduct[productId] ?? [];
  state.itemsByProduct[productId] = upsertQuestion(existing, question);
  state.selectedProductId = productId;
  state.mutationStatus = 'succeeded';
  state.error = null;
};

const setMutationError = (
  state: ProductQuestionsState,
  action: { error?: { message?: string } },
  fallback: string,
) => {
  state.mutationStatus = 'failed';
  state.error = action.error?.message ?? fallback;
};

const productQuestionsSlice = createSlice({
  name: 'productQuestions',
  initialState,
  reducers: {
    setSelectedProductQuestionsProduct(state, action: PayloadAction<string | null>) {
      state.selectedProductId = action.payload ? String(action.payload) : null;
    },
    clearProductQuestionsState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(productApi.endpoints.getProductQuestions.matchPending, (state) => {
        state.listStatus = 'loading';
        state.error = null;
      })
      .addMatcher(productApi.endpoints.getProductQuestions.matchFulfilled, (state, action) => {
        const productId = String(action.meta.arg.originalArgs.productId);
        setQuestionsForProduct(state, productId, action.payload);
        state.listStatus = 'succeeded';
        state.error = null;
      })
      .addMatcher(productApi.endpoints.getProductQuestions.matchRejected, (state, action) => {
        state.listStatus = 'failed';
        state.error = action.error?.message ?? 'Could not load product questions.';
      })
      .addMatcher(productApi.endpoints.postProductQuestion.matchPending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addMatcher(productApi.endpoints.postProductQuestion.matchFulfilled, (state, action) => {
        setMutationSuccess(state, action.payload);
      })
      .addMatcher(productApi.endpoints.postProductQuestion.matchRejected, (state, action) => {
        setMutationError(state, action, 'Could not create product question.');
      })
      .addMatcher(productApi.endpoints.answerProductQuestion.matchPending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addMatcher(productApi.endpoints.answerProductQuestion.matchFulfilled, (state, action) => {
        setMutationSuccess(state, action.payload);
      })
      .addMatcher(productApi.endpoints.answerProductQuestion.matchRejected, (state, action) => {
        setMutationError(state, action, 'Could not answer product question.');
      })
      .addMatcher(productApi.endpoints.setProductQuestionVisibility.matchPending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addMatcher(
        productApi.endpoints.setProductQuestionVisibility.matchFulfilled,
        (state, action) => {
          setMutationSuccess(state, action.payload);
        },
      )
      .addMatcher(productApi.endpoints.setProductQuestionVisibility.matchRejected, (state, action) => {
        setMutationError(state, action, 'Could not update product question visibility.');
      })
      .addMatcher(productApi.endpoints.setProductQuestionBlock.matchPending, (state) => {
        state.mutationStatus = 'loading';
        state.error = null;
      })
      .addMatcher(productApi.endpoints.setProductQuestionBlock.matchFulfilled, (state, action) => {
        setMutationSuccess(state, action.payload);
      })
      .addMatcher(productApi.endpoints.setProductQuestionBlock.matchRejected, (state, action) => {
        setMutationError(state, action, 'Could not update product question block state.');
      });
  },
});

export const { setSelectedProductQuestionsProduct, clearProductQuestionsState } =
  productQuestionsSlice.actions;
export default productQuestionsSlice.reducer;

const selectProductQuestionsState = (state: RootState) => state.productQuestions;

export const selectSelectedProductQuestionsProductId = createSelector(
  selectProductQuestionsState,
  (state) => state.selectedProductId,
);

export const selectProductQuestionsByProduct = (productId: string) =>
  createSelector(
    selectProductQuestionsState,
    (state) => state.itemsByProduct[String(productId)] ?? [],
  );

export const selectSelectedProductQuestions = createSelector(
  selectProductQuestionsState,
  (state) => {
    if (!state.selectedProductId) return [];
    return state.itemsByProduct[state.selectedProductId] ?? [];
  },
);

export const selectProductQuestionsStatuses = createSelector(
  selectProductQuestionsState,
  (state) => ({
    list: state.listStatus,
    mutation: state.mutationStatus,
  }),
);

export const selectProductQuestionsError = createSelector(
  selectProductQuestionsState,
  (state) => state.error,
);
