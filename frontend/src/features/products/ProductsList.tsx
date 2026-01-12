import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { useGetProductsQuery } from '../api/apiSlice';
import { selectProduct, setStep } from '../cart/cartSlice';

const Container = styled.div`
  padding: 2rem 0;
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeIn 0.6s ease-out;
`;

const Title = styled.h1`
  text-align: center;
  color: var(--text-color);
  margin-bottom: 3rem;
  font-weight: 800;
  font-size: 2.5rem;
  letter-spacing: -1px;
  
  span {
    background: linear-gradient(135deg, var(--primary) 0%, #a5b4fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2.5rem;
  padding: 0 1rem;
`;

const Card = styled.div`
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: var(--glass-border);
  border-radius: 20px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-lg);
    border-color: rgba(255, 255, 255, 0.6);
  }
`;

const ImageContainer = styled.div`
  background: white;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 250px;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle at center, rgba(0,0,0,0.02) 0%, transparent 70%);
  }
`;

const Image = styled.img`
  max-width: 80%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
  filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));

  ${Card}:hover & {
    transform: scale(1.08);
  }
`;

const Content = styled.div`
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Name = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-color);
`;

const Description = styled.p`
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
  flex-grow: 1;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(0,0,0,0.05);
`;

const Price = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary);
  letter-spacing: -0.5px;
`;

const Stock = styled.div<{ $warning?: boolean }>`
  font-size: 0.85rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  background: ${props => props.$warning ? '#fff7ed' : '#f0fdf4'};
  color: ${props => props.$warning ? '#c2410c' : '#15803d'};
`;

const Button = styled.button`
  width: 100%;
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(92, 103, 245, 0.3);
  
  &:hover:not(:disabled) {
    background: var(--primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(92, 103, 245, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const ProductsList = () => {
  const { data: products, isLoading, error } = useGetProductsQuery(undefined);
  const dispatch = useDispatch();

  const handleBuy = (id: string) => {
    dispatch(selectProduct(id));
    dispatch(setStep('PAYMENT'));
  };

  if (isLoading) return <Container>Loading store...</Container>;
  if (error) return <Container>Error loading products.</Container>;

  return (
    <Container>
      <Title>Wompi <span>Store</span></Title>
      <Grid>
        {products?.map((product: any) => (
          <Card key={product.id}>
            <ImageContainer>
              <Image src={product.imageUrl} alt={product.name} />
            </ImageContainer>
            <Content>
              <Name>{product.name}</Name>
              <Description>{product.description}</Description>

              <Footer>
                <Price>${(product.price / 100).toLocaleString()}</Price>
                <Stock $warning={product.stock < 5}>
                  {product.stock > 0 ? `${product.stock} Left` : 'Sold Out'}
                </Stock>
              </Footer>

              <Button
                onClick={() => handleBuy(product.id)}
                disabled={product.stock === 0}
              >
                {product.stock > 0 ? 'Buy Now' : 'Out of Stock'}
              </Button>
            </Content>
          </Card>
        ))}
      </Grid>
    </Container>
  );
};

export default ProductsList;
