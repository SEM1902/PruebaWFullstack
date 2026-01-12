import React, { useState } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { setTransactionData, setStep, selectProduct } from '../../features/cart/cartSlice';
import { isValidCreditCard, getCardType } from '../../utils/validation';

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
  padding: 2.5rem;
  border-radius: 24px;
  width: 95%;
  max-width: 550px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.5);

  /* Hide Scrollbar */
  &::-webkit-scrollbar { width: 0; height: 0; }
`;

const VisualCard = styled.div`
  width: 100%;
  height: 220px;
  border-radius: 16px;
  background: linear-gradient(135deg, #1e1e2f 0%, #2d2d44 100%);
  color: white;
  padding: 25px;
  margin-bottom: 2rem;
  box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transform-style: preserve-3d;
  transition: transform 0.6s;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border-radius: 16px;
    background: linear-gradient(125deg, rgba(255,255,255,0.1) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.1) 100%);
    pointer-events: none;
  }
`;

const Chip = styled.div`
  width: 50px;
  height: 35px;
  background: linear-gradient(135deg, #d4af37 0%, #f9e59d 50%, #d4af37 100%);
  border-radius: 6px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 50%; left: 0; width: 100%; height: 1px;
    background: rgba(0,0,0,0.2);
  }
`;

const CardNumber = styled.div`
  font-size: 1.6rem;
  letter-spacing: 2px;
  font-family: 'Courier New', monospace;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
`;

const CardDetails = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
`;

const CardLabel = styled.div`
  font-size: 0.7rem;
  text-transform: uppercase;
  opacity: 0.7;
  margin-bottom: 4px;
`;

const CardValue = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 1.1rem;
  text-transform: uppercase;
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  color: #4b5563;
  margin: 1.5rem 0 1rem 0;
  border-bottom: 2px solid #f3f4f6;
  padding-bottom: 0.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.2rem;
  position: relative;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.9rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
  background: #f9fafb;

  &:focus {
    outline: none;
    border-color: #5c67f5;
    background: white;
    box-shadow: 0 0 0 4px rgba(92, 103, 245, 0.1);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #5c67f5 0%, #4a54c7 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 2rem;
  box-shadow: 0 10px 20px -5px rgba(92, 103, 245, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px -5px rgba(92, 103, 245, 0.5);
  }

  &:active {
    transform: translateY(0);
  }
`;

const SecondaryButton = styled(Button)`
  background: transparent;
  color: #6b7280;
  box-shadow: none;
  margin-top: 0.5rem;
  font-size: 0.95rem;

  &:hover {
    background: #f3f4f6;
    color: #374151;
    transform: none;
    box-shadow: none;
  }
`;

const ErrorMsg = styled.span`
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 4px;
  display: block;
  animation: fadeIn 0.3s;
`;

const PaymentModal = () => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardHolder: '',
    cardExp: '',
    cardCvv: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    region: '',
    postalCode: ''
  });
  const [errors, setErrors] = useState<any>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'cardNumber') {
      const raw = value.replace(/\D/g, '').slice(0, 16);
      setFormData({ ...formData, [name]: raw });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validate = () => {
    const newErrors: any = {};
    if (!isValidCreditCard(formData.cardNumber)) newErrors.cardNumber = 'Invalid Card Number';
    if (!formData.cardHolder) newErrors.cardHolder = 'Required';
    if (!/^\d{2}\/\d{2}$/.test(formData.cardExp)) {
      newErrors.cardExp = 'MM/YY format required';
    } else {
      const [month] = formData.cardExp.split('/');
      if (parseInt(month, 10) < 1 || parseInt(month, 10) > 12) {
        newErrors.cardExp = 'Invalid Month (01-12)';
      }
    }
    if (!/^\d{3,4}$/.test(formData.cardCvv)) newErrors.cardCvv = 'Invalid CVV';
    if (!formData.email.includes('@')) newErrors.email = 'Invalid Email';
    if (!formData.address) newErrors.address = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      dispatch(setTransactionData(formData));
      dispatch(setStep('SUMMARY'));
    }
  };

  const handleCancel = () => {
    dispatch(selectProduct(null)); // Deselect
    dispatch(setStep('PRODUCT'));
  };

  return (
    <Overlay>
      <Modal>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', textAlign: 'center' }}>Secure Checkout</h2>

        <VisualCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Chip />
            <span style={{ fontSize: '1.5rem', opacity: 0.8 }}>VISA</span>
          </div>
          <CardNumber>
            {formData.cardNumber || '0000000000000000'}
          </CardNumber>
          <CardDetails>
            <div>
              <CardLabel>Card Holder</CardLabel>
              <CardValue>{formData.cardHolder || 'FULL NAME'}</CardValue>
            </div>
            <div>
              <CardLabel>Expires</CardLabel>
              <CardValue>{formData.cardExp || 'MM/YY'}</CardValue>
            </div>
          </CardDetails>
        </VisualCard>

        <SectionTitle>Delivery Information</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormGroup>
            <Label>Full Name</Label>
            <Input name="fullName" placeholder="John Doe" onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <Label>Phone</Label>
            <Input name="phone" placeholder="300..." onChange={handleChange} />
          </FormGroup>
        </div>

        <FormGroup>
          <Label>Email</Label>
          <Input name="email" placeholder="john@example.com" onChange={handleChange} />
          {errors.email && <ErrorMsg>{errors.email}</ErrorMsg>}
        </FormGroup>

        <FormGroup>
          <Label>Address</Label>
          <Input name="address" placeholder="Calle 123 #45-67" onChange={handleChange} />
          {errors.address && <ErrorMsg>{errors.address}</ErrorMsg>}
        </FormGroup>

        <FormGroup>
          <Label>City</Label>
          <Input name="city" placeholder="Bogotá" onChange={handleChange} />
        </FormGroup>

        <SectionTitle>Payment Details</SectionTitle>
        <FormGroup>
          <Label>Card Number</Label>
          <Input name="cardNumber" maxLength={19} placeholder="0000 0000 0000 0000" onChange={handleChange} value={formData.cardNumber} />
          {errors.cardNumber && <ErrorMsg>{errors.cardNumber}</ErrorMsg>}
        </FormGroup>
        <FormGroup>
          <Label>Card Holder Name</Label>
          <Input name="cardHolder" placeholder="AS ON CARD" onChange={handleChange} style={{ textTransform: 'uppercase' }} />
        </FormGroup>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <FormGroup style={{ flex: 1 }}>
            <Label>Expiry Date</Label>
            <Input name="cardExp" placeholder="MM/YY" maxLength={5} onChange={handleChange} />
            {errors.cardExp && <ErrorMsg>{errors.cardExp}</ErrorMsg>}
          </FormGroup>
          <FormGroup style={{ flex: 1 }}>
            <Label>CVV / CVC</Label>
            <Input name="cardCvv" type="password" placeholder="123" maxLength={4} onChange={handleChange} data-testid="cvv-input" />
            {errors.cardCvv && <ErrorMsg>{errors.cardCvv}</ErrorMsg>}
          </FormGroup>
        </div>

        <Button onClick={handleSubmit}>Complete Payment</Button>
        <SecondaryButton onClick={handleCancel}>Cancel Transaction</SecondaryButton>
      </Modal>
    </Overlay>
  );
};

export default PaymentModal;
