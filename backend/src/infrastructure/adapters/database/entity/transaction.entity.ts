import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { ProductEntity } from './product.entity';
import { CustomerEntity } from './customer.entity';
import { DeliveryEntity } from './delivery.entity';

@Entity('transactions')
export class TransactionEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    reference: string;

    @Column('int')
    amountInCents: number;

    @Column()
    currency: string;

    @Column()
    status: string;

    @Column({ nullable: true })
    wompiTransactionId: string;

    @ManyToOne(() => ProductEntity)
    @JoinColumn({ name: 'productId' })
    product: ProductEntity;

    @Column()
    productId: string;

    @ManyToOne(() => CustomerEntity, { cascade: true })
    @JoinColumn({ name: 'customerId' })
    customer: CustomerEntity;

    @OneToOne(() => DeliveryEntity, { cascade: true })
    @JoinColumn({ name: 'deliveryId' })
    delivery: DeliveryEntity;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}
