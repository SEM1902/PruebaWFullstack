import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../../app/store';
import { useGetTransactionQuery } from '../api/apiSlice';
import { resetCart } from '../cart/cartSlice';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

const Container = styled.div`
  text-align: center;
  padding: 3rem;
  max-width: 600px;
  margin: 0 auto;
  animation: fadeIn 0.5s ease-out;
`;

const ContentCard = styled.div`
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  padding: 3rem;
  border-radius: 32px;
  box-shadow: 0 25px 50px -12px rgba(60, 70, 200, 0.15);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 6px;
    background: linear-gradient(90deg, #5c67f5, #10b981, #f59e0b);
  }
`;

const Title = styled.h1<{ $status: string }>`
  color: ${props => props.$status === 'APPROVED' ? '#10b981' : props.$status === 'PENDING' ? '#f59e0b' : '#ef4444'};
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
  font-weight: 800;
`;

const Info = styled.div`
  background: rgba(255, 255, 255, 0.5);
  padding: 1.5rem;
  border-radius: 16px;
  margin: 2rem 0;
  text-align: left;
  border: 1px solid rgba(0,0,0,0.05);
`;

const Button = styled.button`
  padding: 1rem 2.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(92, 103, 245, 0.3);

  &:hover {
    background: var(--primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(92, 103, 245, 0.4);
  }
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
  font-size: 1rem;
  color: #4b5563;
  
  &:last-child { margin-bottom: 0; }
`;

const IconWrapper = styled.div`
  font-size: 5rem;
  margin-bottom: 1.5rem;
  animation: bounce 1s infinite;
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
`;

const Result = () => {
  const dispatch = useDispatch();
  const { transactionReference } = useSelector((state: RootState) => state.cart);
  const { data: transaction, isLoading } = useGetTransactionQuery(transactionReference, {
    pollingInterval: 2000, // Check every 2 seconds
    skip: !transactionReference
  });

  useEffect(() => {
    if (transaction?.status === 'APPROVED') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#5c67f5', '#10b981', '#f59e0b']
      });
    }
  }, [transaction]);

  if (isLoading) return <Container>Loading result...</Container>;
  if (!transaction) return <Container>Transaction not found.</Container>;

  return (
    <Container>
      <ContentCard>
        <IconWrapper>
          {transaction.status === 'APPROVED' ? '🎉' : transaction.status === 'PENDING' ? '⏳' : '❌'}
        </IconWrapper>
        <Title $status={transaction.status}>
          {transaction.status === 'APPROVED' ? 'Payment Successful!' : transaction.status === 'PENDING' ? 'Payment Processing' : 'Payment Failed'}
        </Title>

        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
          Reference: <span style={{ fontFamily: 'monospace', fontWeight: 'bold', background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px' }}>{transaction.reference}</span>
        </p>

        <Info>
          <Row><strong>Status:</strong> <span style={{ color: transaction.status === 'APPROVED' ? '#10b981' : transaction.status === 'PENDING' ? '#f59e0b' : '#ef4444', fontWeight: 'bold' }}>{transaction.status}</span></Row>
          <Row><strong>Transaction ID:</strong> <span style={{ fontFamily: 'monospace' }}>{transaction.wompiTransactionId || '-'}</span></Row>
          <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px dashed #e5e7eb' }} />
          <Row><strong>Product:</strong> {transaction.product.name}</Row>
          <Row><strong>Total Paid:</strong> <span style={{ fontWeight: 'bold', color: '#111827' }}>${(transaction.amountInCents / 100).toLocaleString()} {transaction.currency}</span></Row>
        </Info>

        <Button onClick={() => dispatch(resetCart())}>
          Return to Market
        </Button>
      </ContentCard>
    </Container>
  );
};

export default Result;
