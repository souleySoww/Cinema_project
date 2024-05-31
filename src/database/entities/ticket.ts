import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user";
import { Show } from "./show";
import { TicketType } from "../../enumerators/TicketType";

@Entity()
export class Ticket {

    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, (user) => user.tickets)
    user!: User;

    @ManyToMany(() => Show)
    @JoinTable() 
    shows!: Show[];

    @Column()
    type!: TicketType;

    @Column()
    used!: Boolean;

    constructor(id?: number, user?: User, show?: Show[], type?: TicketType, used?: Boolean) {

        if (id) this.id = id;
        if (user) this.user = user;
        if (show) this.shows = show;
        if (type) this.type = type;
        if (used) this.used = used;
    }

}