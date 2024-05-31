import { Column, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Entity } from "typeorm/decorator/entity/Entity";
import { Movie } from "./movie";


@Entity()
export class Image {

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        unique: true
    })
    name!: string;

    @OneToOne(() => Movie, (movie) => movie.image)
    @JoinColumn()
    movie!: Movie;

    @Column()
    path!: string;

    @Column()
    type!: string;

    constructor(id?: string, name?: string, movie?: Movie, path?: string, type?: string) {
        if (id) this.id = id;
        if (name) this.name = name;
        if (movie) this.movie = movie;
        if (path) this.path = path;
        if (type) this.type = type;
    }

}