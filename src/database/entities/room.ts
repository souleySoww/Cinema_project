import { Column, OneToMany, OneToOne } from "typeorm"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Show } from "./show"
//import { faDharmachakra } from "@fortawesome/free-solid-svg-icons"


@Entity()
export class Room {

    @PrimaryGeneratedColumn()
    id!: number

    @Column({
        unique: true
    })
    name!: string

    @Column()
    description!: string

    @Column()
    type!: string

    @Column()
    state!: boolean

    @Column()
    handicapAvailable!: boolean

    @Column()
    capacity!: number

    @OneToMany(() => Show, (show) => show.room)
    shows!: Show[]

    constructor(id?: number, name?: string, description?: string, type?: string, state?: boolean, handicapAvailable?: boolean, capacity?: number, shows?: Show[]) {
        if (id) this.id = id;
        if (name) this.name = name;
        if (description) this.description = description;
        if (type) this.type = type;
        if (state) this.state = state;
        if (handicapAvailable) this.handicapAvailable = handicapAvailable;
        if (capacity) this.capacity = capacity;
        if (shows) this.shows = shows;
    }
}