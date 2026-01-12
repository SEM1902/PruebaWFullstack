import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from '../../../application/services/transactions.service';

describe('TransactionsController', () => {
    let controller: TransactionsController;
    let service;

    beforeEach(async () => {
        service = {
            createTransaction: jest.fn(),
            getTransaction: jest.fn(),
            updateStatus: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [TransactionsController],
            providers: [
                { provide: TransactionsService, useValue: service }
            ],
        }).compile();

        controller = module.get<TransactionsController>(TransactionsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should create a transaction', async () => {
        await controller.create({});
        expect(service.createTransaction).toHaveBeenCalled();
    });

    it('should get a transaction', async () => {
        await controller.get('ref');
        expect(service.getTransaction).toHaveBeenCalledWith('ref');
    });

    it('should update a transaction status', async () => {
        await controller.update('1', 'APPROVED');
        expect(service.updateStatus).toHaveBeenCalledWith('1', 'APPROVED');
    });
});
