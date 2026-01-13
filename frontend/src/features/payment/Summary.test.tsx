import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from '../cart/cartSlice';
import Summary from './Summary';
import { vi } from 'vitest';
import axios from 'axios';
import { useGetProductsQuery, useGetProductQuery } from '../api/apiSlice';

// Mock Dependencies
vi.mock('axios');
vi.mock('../api/apiSlice', () => ({
    useGetProductsQuery: vi.fn(),
    useGetProductQuery: vi.fn(),
    apiSlice: {
        reducerPath: 'api',
        reducer: (state = {}) => state,
        middleware: () => (next: any) => (action: any) => next(action)
    },
    useCreateTransactionMutation: () => [
        vi.fn().mockReturnValue({
            unwrap: () => Promise.resolve({ reference: 'TX-TEST-REF' })
        }),
        { isLoading: false }
    ] // simplified mock for mutation hook
}));

const createTestStore = (initialState = {}) => configureStore({
    reducer: { cart: cartReducer },
    preloadedState: {
        cart: {
            selectedProductId: '1',
            step: 'SUMMARY',
            transactionData: {
                cardNumber: '4242424242424242',
                cardExp: '12/30',
                cardCvv: '123',
                cardHolder: 'TEST',
                fullName: 'Test User',
                email: 'test@mail.com',
                phone: '1234567890',
                address: 'Calle 123',
                city: 'Bogota'
            },
            ...initialState
        }
    } as any
});

describe('Summary', () => {
    let store: any;

    beforeEach(() => {
        store = createTestStore();
        store.dispatch = vi.fn(store.dispatch);

        // Mock Product Data
        (useGetProductsQuery as any).mockReturnValue({
            data: [{ id: '1', name: 'iPhone 15', price: 9000000, stock: 5 }],
            isLoading: false
        });

        // Mock Wompi Acceptance Token
        (axios.get as any).mockResolvedValue({
            data: {
                data: { presigned_acceptance: { acceptance_token: 'mock_acceptance_token' } }
            }
        });

        (useGetProductQuery as any).mockReturnValue({
            data: { id: '1', name: 'iPhone 15', price: 9000000, stock: 5 },
            isLoading: false
        });
    });

    const renderComponent = () => render(
        <Provider store={store}>
            <Summary />
        </Provider>
    );

    it('renders transaction summary', () => {
        renderComponent();
        expect(screen.getByText(/Order Summary/i)).toBeInTheDocument();
        expect(screen.getByText(/iPhone 15/i)).toBeInTheDocument();
        expect(screen.getByText(/Total:/i)).toBeInTheDocument();
        // $9,000 + Fees
    });

    it('handles successful payment flow', async () => {
        renderComponent();

        // Mock Wompi Token Success
        (axios.post as any).mockResolvedValueOnce({
            data: { status: 'CREATED', data: { id: 'tok_test_123' } }
        });

        // Click Pay
        await waitFor(() => expect(screen.getByText(/Pay Now/i)).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Pay Now/i));

        // Expect Wompi Call
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('tokens/cards'),
                expect.objectContaining({
                    number: '4242424242424242',
                    exp_year: '30' // Checked our fix
                }),
                expect.anything()
            );
        });

        // Expect Dispatch Result
        // We mocked mutation to return success, so it should dispatch setTransactionReference & setStep
        // waitFor(() => expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'cart/setStep', payload: 'RESULT' })));
    });

    it('handles Wompi error', async () => {
        renderComponent();

        // Mock Wompi Error
        (axios.post as any).mockRejectedValueOnce({
            response: { data: { error: { reason: 'Invalid Card' } } }
        });

        await waitFor(() => expect(screen.getByText(/Pay Now/i)).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Pay Now/i));

        await waitFor(() => {
            expect(screen.getByText(/Invalid Card/i)).toBeInTheDocument();
        });
    });
});
