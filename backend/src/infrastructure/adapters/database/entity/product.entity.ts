import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('products')
export class ProductEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column('text')
    description: string;

    @Column('int')
    price: number;

    @Column('int')
    stock: number;

    @Column({ nullable: true })
    imageUrl: string;
}
