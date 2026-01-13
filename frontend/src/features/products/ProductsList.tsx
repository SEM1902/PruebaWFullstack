import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { useGetProductsQuery } from '../api/apiSlice';
import { selectProduct, setStep } from '../cart/cartSlice';

const Container = styled.div`
  padding: 3rem 1rem;
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeIn 0.8s ease-out;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 3rem;
  padding: 1rem;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 1);
  border-radius: 24px;
  box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  position: relative;
  
  &:hover {
    transform: translateY(-12px);
    box-shadow: 0 20px 40px -10px rgba(92, 103, 245, 0.2);
    border-color: #5c67f5;
  }
`;

const ImageContainer = styled.div`
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 280px;
  position: relative;
  overflow: hidden;
`;

const Image = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.5s ease;
  filter: drop-shadow(0 20px 20px rgba(0,0,0,0.15));

  ${Card}:hover & {
    transform: scale(1.1) rotate(-3deg);
  }
`;

const Content = styled.div`
  padding: 2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Name = styled.h3`
  margin: 0 0 0.8rem 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.5px;
  line-height: 1.2;
`;

const Description = styled.p`
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  flex-grow: 1;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 1.5rem;
  border-top: 1px dashed rgba(0,0,0,0.1);
`;

const Price = styled.div`
  font-size: 1.75rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: -1px;
  
  span {
    font-size: 1rem;
    color: #9ca3af;
    font-weight: 500;
    margin-right: 4px;
  }
`;

const Stock = styled.div<{ $warning?: boolean }>`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 6px 12px;
  border-radius: 20px;
  letter-spacing: 0.5px;
  background: ${props => props.$warning ? '#fff1f2' : '#ecfdf5'};
  color: ${props => props.$warning ? '#e11d48' : '#059669'};
  border: 1px solid ${props => props.$warning ? '#fecdd3' : '#a7f3d0'};
`;

const Button = styled.button`
  width: 100%;
  margin-top: 1.5rem;
  padding: 1.1rem;
  background: #111827;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover:not(:disabled) {
    background: #5c67f5;
    transform: translateY(-2px);
    box-shadow: 0 10px 20px -5px rgba(92, 103, 245, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #f3f4f6;
    color: #d1d5db;
    cursor: not-allowed;
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
      <Grid>
        {products?.map((product: any) => (
          <Card key={product.id}>
            <ImageContainer>
              <Image src={product.imageUrl} alt={product.name} />
            </ImageContainer>
            <Content>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Name>{product.name}</Name>
                <Stock $warning={product.stock < 5}>
                  {product.stock > 0 ? `${product.stock} Available` : 'Sold Out'}
                </Stock>
              </div>

              <Description>{product.description}</Description>

              <Footer>
                <Price><span>$</span>{(product.price / 100).toLocaleString()}</Price>
              </Footer>

              <Button
                onClick={() => handleBuy(product.id)}
                disabled={product.stock === 0}
              >
                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Button>
            </Content>
          </Card>
        ))}
      </Grid>
    </Container>
  );
};

export default ProductsList;
