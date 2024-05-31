import {
    Column,
    CreateDateColumn,
    DataSource,
    Entity,
    JoinColumn,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn
} from "typeorm";
import { Room } from "./room";
import { Movie } from "./movie";
import { ShowState } from "../../enumerators/ShowState";
import { Ticket } from "./ticket";

@Entity()
export class Show {

    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Room, (room) => room.shows)
    room!: Room;

    @ManyToOne(() => Movie, (movie) => movie.shows)
    movie!: Movie;

    @CreateDateColumn({ type: "datetime" })
    startAt!: Date;

    @CreateDateColumn({ type: "datetime" })
    endAt!: Date;

    @Column()
    state!: ShowState;

    @ManyToMany(() => Ticket, ticket => ticket.shows)
    tickets!: Ticket[];

    visitCount: number = 0;

    constructor(id?: number, room?: Room, movie?: Movie, startAt?: Date, endAt?: Date, state?: ShowState, tickets?: Ticket[]) {
        if (id) this.id = id;
        if (room) this.room = room;
        if (movie) this.movie = movie;
        if (startAt) this.startAt = startAt;
        if (endAt) this.endAt = endAt;
        if (state) this.state = state;
        if (tickets) this.tickets = tickets;
    }

    async takenPlacesCount(dataSource: DataSource): Promise<number> {
        const count = await dataSource
            .getRepository(Ticket)
            .createQueryBuilder("ticket")
            .innerJoin("ticket.shows", "show")
            .where("show.id = :showId", { showId: this.id })
            .andWhere("ticket.used = :used", { used: true })
            .getCount();

        return count;
    }

    async remainingPlacesCount(dataSource: DataSource): Promise<number> {
        const takenCount = await this.takenPlacesCount(dataSource);
        return this.room.capacity - takenCount;
    }
}