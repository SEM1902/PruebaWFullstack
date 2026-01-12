import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface CartState {
    selectedProductId: string | null;
    step: 'PRODUCT' | 'PAYMENT' | 'SUMMARY' | 'RESULT';
    transactionReference: string | null;
    transactionData: any | null; // Temp storage for summary
}

const initialState: CartState = {
    selectedProductId: null,
    step: 'PRODUCT',
    transactionReference: null,
    transactionData: null,
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        selectProduct: (state, action: PayloadAction<string | null>) => {
            state.selectedProductId = action.payload;
        },
        setStep: (state, action: PayloadAction<'PRODUCT' | 'PAYMENT' | 'SUMMARY' | 'RESULT'>) => {
            state.step = action.payload;
        },
        setTransactionReference: (state, action: PayloadAction<string>) => {
            state.transactionReference = action.payload;
        },
        setTransactionData: (state, action: PayloadAction<any>) => {
            state.transactionData = action.payload;
        },
        resetCart: (state) => {
            state.selectedProductId = null;
            state.step = 'PRODUCT';
            state.transactionReference = null;
            state.transactionData = null;
        }
    },
});

export const { selectProduct, setStep, setTransactionReference, setTransactionData, resetCart } = cartSlice.actions;
export default cartSlice.reducer;
