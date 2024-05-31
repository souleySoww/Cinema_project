import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user";
import { TransactionType } from "../../enumerators/TransactionType";

@Entity()
export class Transaction {


    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, (userTransaction) => userTransaction.transactions)
    user!: User;

    @Column()
    amount!: number;

    @Column()
    type!: TransactionType;

    @CreateDateColumn({ type: "datetime" })
    createdAt!: Date;

    constructor(id?: number, user?: User, amount?: number, type?: TransactionType, createdAt?: Date) {
        if (id) this.id = id;
        if (user) this.user = user;
        if (amount) this.amount = amount;
        if (type) this.type = type;
        if (createdAt) this.createdAt = createdAt;
    }

}