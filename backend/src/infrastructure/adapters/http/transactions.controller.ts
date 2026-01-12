import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { TransactionsService } from '../../../application/services/transactions.service';

@Controller('transactions')
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    @Post()
    async create(@Body() body: any) {
        return this.transactionsService.createTransaction(body);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body('status') status: any) {
        return this.transactionsService.updateStatus(id, status);
    }

    @Get(':reference')
    async get(@Param('reference') reference: string) {
        return this.transactionsService.getTransaction(reference);
    }
}
