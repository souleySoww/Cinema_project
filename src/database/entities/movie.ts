import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Image } from "./image"
import { Show } from "./show";

@Entity()
export class Movie {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    description!: string;

    @OneToOne(() => Image, (image) => image.movie)
    image!: Image;

    @OneToMany(() => Show, (show) => show.movie)
    @JoinColumn()
    shows!: Show[];

    @Column()
    duration!: number;

    constructor(id?: number, name?: string, description?: string, image?: Image, shows?: Show[], duration?: number) {
        if (id) this.id = id;
        if (name) this.name = name;
        if (description) this.description = description;
        if (image) this.image = image;
        if (shows) this.shows = shows;
        if (duration) this.duration = duration;
    }
}