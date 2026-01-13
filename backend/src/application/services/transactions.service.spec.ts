import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionEntity } from '../../infrastructure/adapters/database/entity/transaction.entity';
import { ProductEntity } from '../../infrastructure/adapters/database/entity/product.entity';
import { DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';

describe('TransactionsService', () => {
    let service: TransactionsService;
    let productRepo;
    let transactionRepo;
    let dataSource;
    let httpService;
    let configService;

    beforeEach(async () => {
        productRepo = { findOne: jest.fn(), save: jest.fn() };
        transactionRepo = { save: jest.fn() };
        dataSource = {
            createQueryRunner: jest.fn().mockReturnValue({
                connect: jest.fn(),
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
                manager: { save: jest.fn().mockImplementation(x => x) }
            })
        };
        httpService = { post: jest.fn() };
        configService = { get: jest.fn().mockReturnValue('mock_value') };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransactionsService,
                { provide: getRepositoryToken(TransactionEntity), useValue: transactionRepo },
                { provide: getRepositoryToken(ProductEntity), useValue: productRepo },
                { provide: DataSource, useValue: dataSource },
                { provide: HttpService, useValue: httpService },
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        service = module.get<TransactionsService>(TransactionsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create a transaction successfully', async () => {
        const mockProduct = { id: '1', price: 5000000, stock: 10 };
        productRepo.findOne.mockResolvedValue(mockProduct);

        httpService.post.mockReturnValue(of({
            data: { data: { status: 'APPROVED', id: 'wompi_123' } }
        }));

        const result = await service.createTransaction({
            productId: '1',
            customer: { email: 'test@test.com' },
            delivery: {},
            cardToken: 'tok_test'
        });

        expect(result.status).toBe('APPROVED');
        expect(productRepo.save).toHaveBeenCalled(); // Stock update
    });
    it('should throw error if product not found', async () => {
        productRepo.findOne.mockResolvedValue(null);
        await expect(service.createTransaction({ productId: '999' }))
            .rejects.toThrow('Product not found');
    });

    it('should throw error if out of stock', async () => {
        productRepo.findOne.mockResolvedValue({ id: '1', stock: 0 });
        await expect(service.createTransaction({ productId: '1' }))
            .rejects.toThrow('Out of stock');
    });

    it('should handle Wompi API error', async () => {
        const mockProduct = { id: '1', price: 5000000, stock: 10 };
        productRepo.findOne.mockResolvedValue(mockProduct);

        httpService.post.mockReturnValue(of({
            // Axios throws for non-2xx, but here we mock the observable stream error
            // However, NestJS HttpService returns observable that errors out.
            // Let's mock throwing an error
        }));

        // Better mock for error:
        jest.spyOn(httpService, 'post').mockImplementationOnce(() => {
            throw {
                response: {
                    status: 422,
                    data: { message: 'Invalid card' }
                }
            };
        });

        await expect(service.createTransaction({
            productId: '1',
            customer: { email: 'test@test.com' },
            delivery: {},
            cardToken: 'tok_invalid'
        })).rejects.toThrow('Payment failed: Invalid card');

        expect(transactionRepo.save).toHaveBeenCalled(); // Should save ERROR status
    });

    describe('getTransaction', () => {
        it('should return transaction directly if not PENDING', async () => {
            transactionRepo.findOne = jest.fn().mockResolvedValue({
                status: 'APPROVED',
                reference: 'TX-123'
            });

            const result = await service.getTransaction('TX-123');
            expect(result.status).toBe('APPROVED');
            expect(httpService.post).not.toHaveBeenCalled();
        });

        it('should check Wompi and update if PENDING', async () => {
            const mockTx = {
                status: 'PENDING',
                reference: 'TX-123',
                wompiTransactionId: 'wompi_123',
                product: { id: '1', stock: 10 }
            };
            transactionRepo.findOne = jest.fn().mockResolvedValue(mockTx);
            transactionRepo.save = jest.fn();
            productRepo.save = jest.fn();

            httpService.get = jest.fn().mockReturnValue(of({
                data: { data: { status: 'APPROVED' } }
            }));

            const result = await service.getTransaction('TX-123');

            expect(httpService.get).toHaveBeenCalled();
            expect(transactionRepo.save).toHaveBeenCalled();
            expect(mockTx.status).toBe('APPROVED');
            expect(productRepo.save).toHaveBeenCalled(); // Stock decrement
        });
    });

    describe('updateStatus', () => {
        it('should update status and decrement stock if APPROVED', async () => {
            const mockTx = {
                id: '1',
                status: 'PENDING',
                product: { id: '1', stock: 10 }
            };
            transactionRepo.findOne = jest.fn().mockResolvedValue(mockTx);
            transactionRepo.save = jest.fn();
            productRepo.save = jest.fn();

            await service.updateStatus('1', 'APPROVED');

            expect(transactionRepo.save).toHaveBeenCalled();
            expect(mockTx.status).toBe('APPROVED');
            expect(productRepo.save).toHaveBeenCalled();
            expect(mockTx.product.stock).toBe(9);
        });

        it('should throw error if transaction not found', async () => {
            transactionRepo.findOne = jest.fn().mockResolvedValue(null);
            await expect(service.updateStatus('999', 'APPROVED'))
                .rejects.toThrow('Transaction not found');
        });
    });
});
