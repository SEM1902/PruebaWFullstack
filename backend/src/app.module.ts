import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductEntity } from './infrastructure/adapters/database/entity/product.entity';
import { TransactionEntity } from './infrastructure/adapters/database/entity/transaction.entity';
import { CustomerEntity } from './infrastructure/adapters/database/entity/customer.entity';
import { DeliveryEntity } from './infrastructure/adapters/database/entity/delivery.entity';
import { HttpModule } from '@nestjs/axios';
import { SeederService } from './infrastructure/adapters/database/seeder.service';
import { ProductsController } from './infrastructure/adapters/http/products.controller';
import { ProductsService } from './application/services/products.service';
import { TransactionsController } from './infrastructure/adapters/http/transactions.controller';
import { TransactionsService } from './application/services/transactions.service';

import { ConfigModule, ConfigService } from '@nestjs/config';

// ...

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5433),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'wompi_challenge'),
        entities: [ProductEntity, TransactionEntity, CustomerEntity, DeliveryEntity],
        synchronize: true, // DEV only
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([ProductEntity, TransactionEntity, CustomerEntity, DeliveryEntity]),
  ],
  controllers: [AppController, ProductsController, TransactionsController],
  providers: [AppService, SeederService, ProductsService, TransactionsService],
})
export class AppModule { }
