import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3000' }),
  tagTypes: ['Products', 'Transaction'],
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: () => '/products',
      providesTags: ['Products'],
    }),
    getProduct: builder.query({
      query: (id) => `/products/${id}`,
    }),
    createTransaction: builder.mutation({
      query: (body) => ({
        url: '/transactions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Products'], // Stock changes
    }),
    getTransaction: builder.query({
      query: (ref) => `/transactions/${ref}`,
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateTransactionMutation,
  useGetTransactionQuery
} = apiSlice;
