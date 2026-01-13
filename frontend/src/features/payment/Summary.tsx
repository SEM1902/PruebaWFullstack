import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { type RootState } from '../../app/store';
import { useGetProductQuery, useCreateTransactionMutation } from '../api/apiSlice';
import { setStep, setTransactionReference } from '../cart/cartSlice';

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify_content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
`;

const Modal = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 2.5rem;
  border-radius: 24px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.5);
  animation: slideUp 0.4s ease-out;
  position: relative;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
  font-size: 1.05rem;
  color: #374151;
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #204ecf 0%, #1e3a8a 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1.5rem;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }

  &:disabled { 
    background: #9ca3af; 
    cursor: not-allowed; 
    transform: none;
  }
`;

const ErrorMsg = styled.p`
    color: #ef4444;
    background: #fee2e2;
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 0.9rem;
    margin-top: 1rem;
    border: 1px solid #fecaca;
    animation: fadeIn 0.3s;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1001;
  border-radius: 24px;
  color: white;
  font-weight: 600;
  animation: fadeIn 0.3s ease-out;
`;

const Summary = () => {
    const dispatch = useDispatch();
    const { selectedProductId, transactionData } = useSelector((state: RootState) => state.cart);
    const { data: product } = useGetProductQuery(selectedProductId);
    const [createTransaction] = useCreateTransactionMutation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [acceptanceToken, setAcceptanceToken] = useState<string>('');

    const BASE_FEE = 250000; // $2,500
    const DELIVERY_FEE = 1000000; // $10,000

    // Fetch Acceptance Token on Mount
    useEffect(() => {
        const fetchMerchant = async () => {
            try {
                const response = await axios.get(`https://api-sandbox.co.uat.wompi.dev/v1/merchants/${import.meta.env.VITE_WOMPI_PUB_KEY}`);
                const token = response.data.data.presigned_acceptance.acceptance_token;
                setAcceptanceToken(token);
            } catch (error) {
                console.error('Error fetching merchant:', error);
            }
        };
        fetchMerchant();
    }, []);

    if (!transactionData || !product) return null;

    const total = product.price + BASE_FEE + DELIVERY_FEE;

    const handlePayment = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Tokenize Card (Sandbox)
            const [expMonth, expYear] = transactionData.cardExp.split('/');
            // Note: expYear is 2 digits from input (MM/YY)

            const payload = {
                number: transactionData.cardNumber.replace(/\s/g, '').replace(/\D/g, ''),
                cvc: transactionData.cardCvv,
                exp_month: expMonth,
                exp_year: expYear,
                card_holder: transactionData.cardHolder
            };

            console.log('DEBUG: Wompi Token Payload:', payload);

            const tokenResponse = await axios.post(
                'https://api-sandbox.co.uat.wompi.dev/v1/tokens/cards',
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${import.meta.env.VITE_WOMPI_PUB_KEY}`
                    }
                }
            );

            if (tokenResponse.data.status !== 'CREATED') {
                throw new Error('Card Tokenization Failed');
            }

            const token = tokenResponse.data.data.id;

            // 2. Create Transaction on Backend
            const result = await createTransaction({
                productId: selectedProductId,
                customer: {
                    fullName: transactionData.fullName,
                    email: transactionData.email,
                    phoneNumber: transactionData.phone
                },
                delivery: {
                    address: transactionData.address,
                    city: transactionData.city,
                    region: transactionData.region || 'Region',
                    postalCode: transactionData.postalCode || '000000'
                },
                cardToken: token,
                acceptanceToken: acceptanceToken // Real token
            }).unwrap();

            // 3. Success
            dispatch(setTransactionReference(result.reference));
            dispatch(setStep('RESULT'));

        } catch (err: any) {
            console.error('Full Error:', err);
            console.log('DEBUG: Wompi Error Details:', err.response?.data);
            setError(err.response?.data?.error?.reason || err.response?.data?.message || err.message || 'Payment Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Overlay>
            {loading && (
                <LoadingOverlay>
                    <Spinner />
                    <span>Processing Payment...</span>
                </LoadingOverlay>
            )}
            <Modal style={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
                <h2>Order Summary</h2>
                <Row><span>Product:</span><span>{product.name}</span></Row>
                <Row><span>Price:</span><span>${(product.price / 100).toLocaleString()}</span></Row>
                <Row><span>Base Fee:</span><span>${(BASE_FEE / 100).toLocaleString()}</span></Row>
                <Row><span>Delivery:</span><span>${(DELIVERY_FEE / 100).toLocaleString()}</span></Row>
                <hr />
                <Row style={{ fontWeight: 'bold' }}><span>Total:</span><span>${(total / 100).toLocaleString()}</span></Row>

                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                    <p>Deliver to: {transactionData.address}, {transactionData.city}</p>
                    <p>Card: **** {transactionData.cardNumber.slice(-4)}</p>
                </div>

                {error && <ErrorMsg>{error}</ErrorMsg>}

                <Button onClick={handlePayment} disabled={loading || !acceptanceToken}>
                    {loading ? 'Processing...' : !acceptanceToken ? 'Loading Wompi Config...' : 'Pay Now'}
                </Button>
                <Button style={{ background: '#ccc', marginTop: '0.5rem' }} onClick={() => dispatch(setStep('PAYMENT'))} disabled={loading}>
                    Back
                </Button>
            </Modal>
        </Overlay>
    );
};

export default Summary;
