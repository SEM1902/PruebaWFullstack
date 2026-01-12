import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('deliveries')
export class DeliveryEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    address: string;

    @Column()
    city: string;

    @Column()
    region: string;

    @Column()
    postalCode: string;
}
