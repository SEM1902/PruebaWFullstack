import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from '../../../application/services/products.service';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get()
    async getAll() {
        return this.productsService.findAll();
    }

    @Get(':id')
    async getOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }
}
