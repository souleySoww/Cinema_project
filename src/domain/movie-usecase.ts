import {DataSource} from "typeorm";
import {Movie} from "../database/entities/movie";
import {MovieRequest, UpdateMovieRequest} from "../handlers/validators/movie-validator";
import {Image} from "../database/entities/image"

export interface ListMovieFilter {
    limit: number;
    page: number;
    ascending: boolean;
    orderBy: string;
    name?: string;
}

export class MovieUseCase {
    constructor(private readonly db: DataSource) {
    }

    async listMovie(listMovieFilter: ListMovieFilter): Promise<{ movies: Movie[]; totalCount: number; }> {
        const query = this.db.createQueryBuilder(Movie, 'movie');

        query.leftJoinAndSelect('movie.image', 'image');

        if (listMovieFilter.orderBy) {
            const direction = listMovieFilter.ascending ? 'ASC' : 'DESC';
            query.orderBy(`movie.${listMovieFilter.orderBy}`, direction);
        }

        if (listMovieFilter.name) {
            query.andWhere('movie.name LIKE :name', {name: `%${listMovieFilter.name}%`});
        }

        query.skip((listMovieFilter.page - 1) * listMovieFilter.limit);
        query.take(listMovieFilter.limit);

        const [movies, totalCount] = await query.getManyAndCount();
        return {movies, totalCount};
    }

    async getMovieById(movieId: number): Promise<Movie | null> {
        const movieRepository = this.db.getRepository(Movie);

        return await movieRepository.findOne({
            where: {id: movieId},
            relations: {
                image: true,
                shows: {
                    room: true,
                },
            },
        });
    }

    async createMovie(movieData: MovieRequest): Promise<Movie | Error> {
        const movieRepository = this.db.getRepository(Movie);

        const newMovie = new Movie();
        newMovie.description = movieData.description;
        newMovie.name = movieData.name;
        newMovie.duration = movieData.duration;

        return await movieRepository.save(newMovie);
    }

    async getMovieShows(movieId: number): Promise<Movie | null> {

        const movieRepository = this.db.getRepository(Movie);

        return await movieRepository.findOne({
            where: {id: movieId},
            relations: {
                image: true,
                shows: true,
            }
        });
    }

    async updateMovie(updateData: UpdateMovieRequest): Promise<Movie | Error> {
        const movieRepository = this.db.getRepository(Movie);

        const movie = await movieRepository.findOneBy({id: updateData.id});
        if (!movie) {
            return new Error(`Film ${updateData.id} non trouvé`);
        }

        if (updateData.name != undefined && updateData.name != movie.name) {
            movie.name = updateData.name;
        }
        if (updateData.description !== undefined && updateData.description != movie.description) {
            movie.description = updateData.description;
        }

        if (updateData.duration !== undefined && updateData.duration != updateData.duration) {
            movie.duration = updateData.duration;
        }

        // Sauvegarder les modifications dans la base de données
        return await movieRepository.save(movie);
    }
}