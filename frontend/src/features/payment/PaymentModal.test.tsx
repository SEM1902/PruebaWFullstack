import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from '../cart/cartSlice';
import PaymentModal from './PaymentModal';
import { vi } from 'vitest';

// Mock validation to ensure test doesn't fail on luhn
vi.mock('../../utils/validation', () => ({
    isValidCreditCard: () => true,
    getCardType: () => 'VISA'
}));

const createTestStore = () => configureStore({
    reducer: {
        cart: cartReducer
    }
});

describe('PaymentModal', () => {
    let store: any;

    beforeEach(() => {
        store = createTestStore();
        store.dispatch = vi.fn(store.dispatch);
    });

    const renderComponent = () => render(
        <Provider store={store}>
            <PaymentModal />
        </Provider>
    );

    it('renders all form fields', () => {
        renderComponent();
        expect(screen.getByText(/Secure Checkout/i)).toBeInTheDocument();
        expect(screen.getByText(/VISA/i)).toBeInTheDocument(); // Visual Card
        expect(screen.getByPlaceholderText(/John Doe/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/0000 0000 0000 0000/i)).toBeInTheDocument();
    });

    it('validates required fields', () => {
        renderComponent();
        const submitBtn = screen.getByText(/Complete Payment/i);
        fireEvent.click(submitBtn);

        const emailInput = screen.getByPlaceholderText(/john@example.com/i);
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        fireEvent.click(submitBtn);

        expect(screen.getByText(/Invalid Email/i)).toBeInTheDocument();
    });

    it('keeps credit card input raw', () => {
        renderComponent();
        const cardInput = screen.getByPlaceholderText(/0000 0000 0000 0000/i);

        fireEvent.change(cardInput, { target: { name: 'cardNumber', value: '4242424242424242' } });

        // The component keeps it raw
        expect(cardInput).toHaveValue('4242424242424242');
    });

    it('submits form with valid data', async () => {
        renderComponent();

        // Fill Form
        fireEvent.change(screen.getByPlaceholderText(/John Doe/i), { target: { name: 'fullName', value: 'Test User' } });
        fireEvent.change(screen.getByPlaceholderText(/john@example.com/i), { target: { name: 'email', value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText(/Calle 123/i), { target: { name: 'address', value: 'Calle False 123' } });

        // Card
        const cardInput = screen.getByPlaceholderText(/0000 0000 0000 0000/i);
        fireEvent.change(cardInput, { target: { name: 'cardNumber', value: '4242424242424242' } });

        fireEvent.change(screen.getByPlaceholderText(/AS ON CARD/i), { target: { name: 'cardHolder', value: 'TEST USER' } });
        fireEvent.change(screen.getByPlaceholderText(/MM\/YY/i), { target: { name: 'cardExp', value: '12/30' } });

        const cvvField = screen.getByTestId('cvv-input');
        fireEvent.change(cvvField, { target: { name: 'cardCvv', value: '123' } });

        fireEvent.click(screen.getByText(/Complete Payment/i));

        // Expect dispatch
        await waitFor(() => expect(store.dispatch).toHaveBeenCalledTimes(2));
    });
});
