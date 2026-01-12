import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from './entity/product.entity';

@Injectable()
export class SeederService implements OnModuleInit {
    constructor(
        @InjectRepository(ProductEntity)
        private readonly productRepository: Repository<ProductEntity>,
    ) { }

    async onModuleInit() {
        await this.seedProducts();
    }

    private async seedProducts() {
        // Check and update existing products or create new ones
        const count = await this.productRepository.count();
        if (count === 0) {
            console.log('Seeding initial products...');
        } else {
            console.log('Updating existing products...');
        }

        const products = [
            {
                name: 'iPhone 15 Pro',
                description: 'Titanium design, A17 Pro chip, 48MP Main camera.',
                price: 450000000, // in cents ($4,500,000)
                stock: 10,
                imageUrl: '/products/iphone-15-pro.png',
            },
            {
                name: 'MacBook Air M2',
                description: 'Supercharged by M2. 18 hours battery life.',
                price: 550000000, // in cents ($5,500,000)
                stock: 5,
                imageUrl: '/products/macbook-air-m2.png',
            },
            {
                name: 'Sony WH-1000XM5',
                description: 'Noise cancelling headphones, 30 hours battery.',
                price: 150000000, // in cents ($1,500,000)
                stock: 20,
                imageUrl: '/products/sony-wh-1000xm5.png',
            },
            {
                name: 'Nintendo Switch OLED',
                description: '7-inch OLED screen, wide adjustable stand.',
                price: 180000000, // in cents ($1,800,000)
                stock: 15,
                imageUrl: 'https://assets.nintendo.com/image/upload/f_auto/q_auto/dpr_1.5/c_scale,w_600/ncom/en_US/switch/site-design-update/hardware/switch/nintendo-switch-oled-model-white-set/gallery/image01',
            },
        ];

        for (const productData of products) {
            const existing = await this.productRepository.findOne({ where: { name: productData.name } });
            if (existing) {
                existing.imageUrl = productData.imageUrl;
                existing.description = productData.description;
                existing.price = productData.price;
                existing.stock = productData.stock;
                await this.productRepository.save(existing);
            } else {
                await this.productRepository.save(productData);
            }
        }
        console.log('Products seeded/updated successfully');
    }
}
