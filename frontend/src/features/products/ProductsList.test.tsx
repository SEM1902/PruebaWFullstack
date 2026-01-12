import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from '../cart/cartSlice';
import ProductsList from './ProductsList';
import { vi } from 'vitest';
import { useGetProductsQuery } from '../api/apiSlice';

// Mock the API Hook
vi.mock('../api/apiSlice', () => ({
    useGetProductsQuery: vi.fn(),
    apiSlice: { reducerPath: 'api', reducer: (state = {}) => state, middleware: (getDefault: any) => getDefault() }
}));

const createTestStore = () => configureStore({
    reducer: {
        cart: cartReducer,
        // api reducer needed if we weren't mocking the hook entirely, but here it's fine
    }
});

describe('ProductsList', () => {
    let store: any;

    beforeEach(() => {
        store = createTestStore();
        store.dispatch = vi.fn(store.dispatch);

        // Default Mock Return
        (useGetProductsQuery as any).mockReturnValue({
            data: [
                { id: '1', name: 'iPhone 15', description: 'Titanium', price: 9999900, stock: 5, imageUrl: 'img.jpg' },
                { id: '2', name: 'Case', description: 'Protective', price: 49900, stock: 0, imageUrl: 'case.jpg' }
            ],
            isLoading: false
        });
    });

    const renderComponent = () => render(
        <Provider store={store}>
            <ProductsList />
        </Provider>
    );

    it('renders products from data', () => {
        renderComponent();
        expect(screen.getByText('iPhone 15')).toBeInTheDocument();
        expect(screen.getByText('Case')).toBeInTheDocument();
        expect(screen.getByText('$99,999')).toBeInTheDocument(); // Formatted
    });

    it('handles loading state', () => {
        (useGetProductsQuery as any).mockReturnValue({ isLoading: true });
        renderComponent();
        expect(screen.getByText(/Loading store/i)).toBeInTheDocument();
    });

    it('handles error state', () => {
        (useGetProductsQuery as any).mockReturnValue({ error: true });
        renderComponent();
        expect(screen.getByText(/Error loading products/i)).toBeInTheDocument();
    });

    it('disables buy button when out of stock', () => {
        renderComponent();
        const btns = screen.getAllByRole('button');
        // Second button (Case) has stock 0
        expect(btns[1]).toBeDisabled();
        expect(btns[1]).toHaveTextContent('Out of Stock');
    });

    it('dispatches selectProduct on buy click', () => {
        renderComponent();
        const buyBtn = screen.getAllByText('Buy Now')[0];
        fireEvent.click(buyBtn);

        expect(store.dispatch).toHaveBeenCalledTimes(2);
        // 1. selectProduct('1')
        // 2. setStep('PAYMENT')
    });
});
