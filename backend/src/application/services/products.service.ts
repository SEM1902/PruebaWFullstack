import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../../infrastructure/adapters/database/entity/product.entity';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(ProductEntity)
        private readonly productRepository: Repository<ProductEntity>,
    ) { }

    async findAll() {
        return this.productRepository.find();
    }

    async findOne(id: string) {
        const product = await this.productRepository.findOne({ where: { id } });
        if (!product) throw new NotFoundException('Product not found');
        return product;
    }
}
