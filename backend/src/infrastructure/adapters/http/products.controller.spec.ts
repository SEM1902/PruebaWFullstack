import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from '../../../application/services/products.service';

describe('ProductsController', () => {
    let controller: ProductsController;
    let service;

    beforeEach(async () => {
        service = {
            findAll: jest.fn().mockResolvedValue([]),
            findById: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProductsController],
            providers: [
                { provide: ProductsService, useValue: service }
            ],
        }).compile();

        controller = module.get<ProductsController>(ProductsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return all products', async () => {
        expect(await controller.getAll()).toEqual([]);
        expect(service.findAll).toHaveBeenCalled();
    });
});
