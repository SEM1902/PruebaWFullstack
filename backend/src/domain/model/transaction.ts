export enum TransactionStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    DECLINED = 'DECLINED',
    ERROR = 'ERROR',
    VOIDED = 'VOIDED'
}

export class Transaction {
    constructor(
        public readonly id: string,
        public readonly reference: string,
        public readonly amountInCents: number,
        public readonly currency: string,
        public readonly customerEmail: string,
        public readonly status: TransactionStatus,
        public readonly productId: string,
        public readonly deliveryId?: string,
        public readonly wompiTransactionId?: string,
    ) { }
}
