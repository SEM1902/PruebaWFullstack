import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from '../cart/cartSlice';
import Result from './Result';
import { vi } from 'vitest';
import { useGetTransactionQuery } from '../api/apiSlice';

vi.mock('../api/apiSlice', () => ({
    useGetTransactionQuery: vi.fn(),
    apiSlice: { reducerPath: 'api', reducer: (state = {}) => state, middleware: () => (next: any) => (action: any) => next(action) }
}));

// Mock confetti
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const createTestStore = (initialState = {}) => configureStore({
    reducer: { cart: cartReducer },
    preloadedState: {
        cart: {
            transactionReference: 'TX-REF',
            step: 'RESULT',
            ...initialState
        }
    } as any
});

describe('Result', () => {
    let store: any;

    const setup = (mockData: any) => {
        store = createTestStore();
        store.dispatch = vi.fn(store.dispatch);
        (useGetTransactionQuery as any).mockReturnValue(mockData);

        return render(
            <Provider store={store}>
                <Result />
            </Provider>
        );
    };

    it('renders loading state', () => {
        setup({ isLoading: true });
        expect(screen.getByText(/Loading result.../i)).toBeInTheDocument();
    });

    it('renders APPROVED state', () => {
        setup({
            data: {
                status: 'APPROVED',
                amountInCents: 100000,
                currency: 'COP',
                reference: 'TX-REF',
                product: { name: 'iPhone 15' }
            },
            isLoading: false
        });

        expect(screen.getByText(/Payment Successful/i)).toBeInTheDocument();
        expect(screen.getByText(/\$1,000/i)).toBeInTheDocument();
        expect(screen.getByText(/APPROVED/i)).toBeInTheDocument();
        expect(screen.getByText(/iPhone 15/i)).toBeInTheDocument();
    });

    it('renders DECLINED state', () => {
        setup({
            data: {
                status: 'DECLINED',
                amountInCents: 100000,
                currency: 'COP',
                reference: 'TX-REF',
                statusMessage: 'Insufficient Funds',
                product: { name: 'iPhone 15' }
            },
            isLoading: false
        });

        expect(screen.getByText(/Payment Failed/i)).toBeInTheDocument();
    });

    it('renders ERROR state', () => {
        setup({
            data: {
                status: 'ERROR',
                amountInCents: 100000,
                currency: 'COP',
                reference: 'TX-REF',
                product: { name: 'iPhone 15' }
            },
            isLoading: false
        });

        expect(screen.getByText(/Payment Failed/i)).toBeInTheDocument();
    });

    it('renders default/null state', () => {
        setup({ data: null, isLoading: false, isError: true });
        expect(screen.getByText(/Transaction not found/i)).toBeInTheDocument();
    });

    it('allows going back home', () => {
        setup({
            data: {
                status: 'APPROVED',
                amountInCents: 100000,
                currency: 'COP',
                product: { name: 'iPhone 15' },
                reference: 'TX-REF'
            },
            isLoading: false
        });

        fireEvent.click(screen.getByText(/Return to Market/i));
        expect(store.dispatch).toHaveBeenCalledTimes(1);
    });
});
