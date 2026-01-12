import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductEntity } from '../../infrastructure/adapters/database/entity/product.entity';

describe('ProductsService', () => {
    let service: ProductsService;
    let repo;

    beforeEach(async () => {
        repo = {
            find: jest.fn(),
            findOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductsService,
                { provide: getRepositoryToken(ProductEntity), useValue: repo },
            ],
        }).compile();

        service = module.get<ProductsService>(ProductsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should find all products', async () => {
        repo.find.mockResolvedValue([]);
        expect(await service.findAll()).toEqual([]);
    });
});
