import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('customers')
export class CustomerEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    fullName: string;

    @Column()
    email: string;

    @Column()
    phoneNumber: string;
}
