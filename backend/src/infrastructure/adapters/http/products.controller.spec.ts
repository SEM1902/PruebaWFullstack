import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from '../../../application/services/products.service';

describe('ProductsController', () => {
    let controller: ProductsController;
    let service: ProductsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProductsController],
            providers: [
                {
                    provide: ProductsService,
                    useValue: {
                        findAll: jest.fn().mockResolvedValue([{ id: '1', name: 'Test Product' }]),
                        findOne: jest.fn().mockResolvedValue({ id: '1', name: 'Test Product' }),
                    },
                },
            ],
        }).compile();

        controller = module.get<ProductsController>(ProductsController);
        service = module.get<ProductsService>(ProductsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('getAll should return all products', async () => {
        const result = await controller.getAll();
        expect(result).toHaveLength(1);
        expect(service.findAll).toHaveBeenCalled();
    });

    it('getOne should return a product', async () => {
        const result = await controller.getOne('1');
        expect(result).toEqual({ id: '1', name: 'Test Product' });
        expect(service.findOne).toHaveBeenCalledWith('1');
    });
});
