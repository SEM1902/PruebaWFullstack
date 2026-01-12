import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { TransactionEntity } from '../../infrastructure/adapters/database/entity/transaction.entity';
import { ProductEntity } from '../../infrastructure/adapters/database/entity/product.entity';
import { CustomerEntity } from '../../infrastructure/adapters/database/entity/customer.entity';
import { DeliveryEntity } from '../../infrastructure/adapters/database/entity/delivery.entity';

@Injectable()
export class TransactionsService {
    private readonly WOMPI_API: string;
    private readonly PRV_KEY: string;
    private readonly INTEGRITY_KEY: string;

    constructor(
        @InjectRepository(TransactionEntity)
        private readonly transactionRepository: Repository<TransactionEntity>,
        @InjectRepository(ProductEntity)
        private readonly productRepository: Repository<ProductEntity>,
        private readonly dataSource: DataSource,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.WOMPI_API = this.configService.get<string>('WOMPI_API_URL') || '';
        this.PRV_KEY = this.configService.get<string>('WOMPI_PRV_KEY') || '';
        this.INTEGRITY_KEY = this.configService.get<string>('WOMPI_INTEGRITY_KEY') || '';

        console.log('--- TransactionsService Config ---');
        console.log('WOMPI_API:', this.WOMPI_API);
        console.log('PRV_KEY Loaded:', !!this.PRV_KEY);
        console.log('INTEGRITY_KEY Loaded:', !!this.INTEGRITY_KEY);
    }

    private computeSignature(reference: string, amountInCents: number, currency: string, integrityKey: string): string {
        const chain = `${reference}${amountInCents}${currency}${integrityKey}`;
        return crypto.createHash('sha256').update(chain).digest('hex');
    }

    async createTransaction(data: any) {
        const { productId, customer, delivery, cardToken, acceptanceToken } = data;

        // 1. Validate Product and Stock
        const product = await this.productRepository.findOne({ where: { id: productId } });
        if (!product) throw new BadRequestException('Product not found');
        if (product.stock < 1) throw new BadRequestException('Out of stock');

        // 2. Calculate Amounts (Simplified: Product Price + Base Fee + Delivery)
        const BASE_FEE = 250000; // $2,500
        const DELIVERY_FEE = 1000000; // $10,000
        const amountInCents = product.price + BASE_FEE + DELIVERY_FEE;
        const reference = `TX-${uuidv4().substring(0, 8)}`;

        // 3. Create Pending Transaction
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let transaction: TransactionEntity;

        try {
            const newCustomer = new CustomerEntity();
            Object.assign(newCustomer, customer);

            const newDelivery = new DeliveryEntity();
            Object.assign(newDelivery, delivery);

            transaction = new TransactionEntity();
            transaction.reference = reference;
            transaction.amountInCents = amountInCents;
            transaction.currency = 'COP';
            transaction.status = 'PENDING';
            transaction.product = product;
            transaction.customer = newCustomer;
            transaction.delivery = newDelivery;

            transaction = await queryRunner.manager.save(transaction);
            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw new InternalServerErrorException('Failed to initialize transaction');
        } finally {
            await queryRunner.release();
        }

        // 4. Call Wompi API
        const signature = this.computeSignature(reference, amountInCents, 'COP', this.INTEGRITY_KEY);

        try {
            const payload = {
                amount_in_cents: amountInCents,
                currency: 'COP',
                customer_email: customer.email,
                payment_method: {
                    type: 'CARD',
                    token: cardToken,
                    installments: 1, // Default to 1
                },
                reference: reference,
                acceptance_token: acceptanceToken,
                signature: signature
            };

            const wompiResponse = await lastValueFrom(
                this.httpService.post(`${this.WOMPI_API}/transactions`, payload, {
                    headers: {
                        Authorization: `Bearer ${this.PRV_KEY}`,
                    },
                })
            );

            const wompiData = wompiResponse.data.data;
            const status = wompiData.status; // APPROVED, DECLINED, ERROR

            // 5. Update Transaction
            transaction.status = status;
            transaction.wompiTransactionId = wompiData.id;
            await this.transactionRepository.save(transaction);

            // 6. Update Stock if Approved
            if (status === 'APPROVED') {
                product.stock -= 1;
                await this.productRepository.save(product);
            }

            return transaction;

        } catch (error) {
            // Handle Wompi Error
            const wompiError = error.response?.data;
            console.error('--------------- WOMPI ERROR DEBUG ---------------');
            console.error('Status:', error.response?.status);
            console.error('Error Data:', JSON.stringify(wompiError, null, 2));
            console.error('Signature Input:', {
                ref: reference,
                amount: amountInCents,
                currency: 'COP',
                integrityKeyLoaded: !!this.INTEGRITY_KEY,
                generatedSignature: signature
            });
            console.error('-------------------------------------------------');

            transaction.status = 'ERROR';
            await this.transactionRepository.save(transaction);

            // Re-throw with more detail
            const reason = wompiError?.error?.reason || wompiError?.message || 'Wompi Validation Failed';
            throw new BadRequestException(`Payment failed: ${reason}`);
        }
    }

    async getTransaction(reference: string) {
        return this.transactionRepository.findOne({
            where: { reference },
            relations: ['product', 'customer', 'delivery']
        });
    }

    async updateStatus(id: string, status: 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED') {
        const transaction = await this.transactionRepository.findOne({ where: { id }, relations: ['product'] });
        if (!transaction) throw new BadRequestException('Transaction not found');

        // Only update if status is different
        if (transaction.status === status) return transaction;

        transaction.status = status;
        await this.transactionRepository.save(transaction);

        // If status changes to APPROVED (e.g. async webhook), decrement stock
        // Note: In createTransaction we already decrement if APPROVED immediately.
        // This is for cases where it goes PENDING -> APPROVED later.
        if (status === 'APPROVED') {
            const product = transaction.product;
            if (product.stock > 0) {
                product.stock -= 1;
                await this.productRepository.save(product);
            }
        }

        return transaction;
    }
}
