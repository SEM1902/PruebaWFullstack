export const isValidCreditCard = (number: string): boolean => {
    const sanitized = number.replace(/\D/g, '');
    if (!sanitized) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = sanitized.length - 1; i >= 0; i--) {
        let digit = parseInt(sanitized.charAt(i));
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
};

export const getCardType = (number: string): 'VISA' | 'MASTERCARD' | 'UNKNOWN' => {
    const sanitized = number.replace(/\D/g, '');
    if (/^4/.test(sanitized)) return 'VISA';
    if (/^5[1-5]/.test(sanitized)) return 'MASTERCARD';
    return 'UNKNOWN';
};
