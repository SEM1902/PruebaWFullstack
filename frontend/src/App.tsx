import { useSelector } from 'react-redux';
import { type RootState } from './app/store';
import ProductsList from './features/products/ProductsList';
import PaymentModal from './features/payment/PaymentModal';
import Summary from './features/payment/Summary';
import Result from './features/payment/Result';
import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  :root {
    --primary: #5c67f5;
    --primary-hover: #4a54c7;
    --bg-color: #f8f9fa;
    --text-color: #1a1b1e;
    --card-bg: rgba(255, 255, 255, 0.85);
    --glass-border: 1px solid rgba(255, 255, 255, 0.3);
    --shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    --shadow-lg: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
  }

  body {
    margin: 0;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background-color: var(--bg-color);
    color: var(--text-color);
    background-image: 
      radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), 
      radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), 
      radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%);
    background-size: 100% 100vh;
    background-repeat: no-repeat;
    background-attachment: fixed;
    min-height: 100vh;
  }

  * { box-sizing: border-box; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const LayoutWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 1rem 0;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  /* Glassmorphism */
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0 0 16px 16px;
  padding: 1rem 2rem;
`;

const Logo = styled.div`
  font-weight: 800;
  font-size: 1.5rem;
  background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
`;

const Footer = styled.footer`
  margin-top: auto;
  padding: 2rem 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
`;

const MainContent = styled.main`
  flex: 1;
  animation: fadeIn 0.5s ease-out;
`;

const CheckoutFlow = () => {
  const step = useSelector((state: RootState) => state.cart.step);

  return (
    <MainContent>
      {step !== 'RESULT' && <ProductsList />}

      {step === 'PAYMENT' && <PaymentModal />}
      {step === 'SUMMARY' && <Summary />}
      {step === 'RESULT' && <Result />}
    </MainContent>
  );
};

function App() {
  return (
    <>
      <GlobalStyle />
      <LayoutWrapper>
        <Header>
          <Logo>WompiStore</Logo>
          <div style={{ color: 'white', fontWeight: 500 }}>Challenge</div>
        </Header>
        <CheckoutFlow />
        <Footer>
          © 2026 Wompi Certification Challenge • By Sem
        </Footer>
      </LayoutWrapper>
    </>
  );
}

export default App;
