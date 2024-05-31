import {DataSource, DeleteResult} from "typeorm";
import {Show} from "../database/entities/show";
import {ShowRequest, UpdateShowRequest} from "../handlers/validators/show-validator";
import {Movie} from "../database/entities/movie";
import {Room} from "../database/entities/room";
import {Ticket} from "../database/entities/ticket";
import {AppDataSource} from "../database/database";
import {TicketUseCase} from "./ticket-usecase";
import {UpdateTicketRequest} from "../handlers/validators/ticket-validator";

export interface ListShowFilter {
    limit: number;
    page: number;
    ascending: boolean;
    orderBy: string;
    startAtMin?: Date;
    startAtMax?: Date;
    endAtMin?: Date;
    endAtMax?: Date;
    movieId?: number
    roomId?: number
}

export class ShowUsecase {
    constructor(private readonly db: DataSource) {
    }

    async listShow(listShowFilter: ListShowFilter): Promise<{ shows: Show[]; totalCount: number; }> {
        const query = this.db.createQueryBuilder(Show, 'show');

        query.leftJoinAndSelect('show.room', 'room');
        query.leftJoinAndSelect('show.movie', 'movie');
        query.leftJoinAndSelect('movie.image', 'image');

        query.andWhere('room.state = :roomState', {roomState: true});

        if (listShowFilter.startAtMin) {
            query.andWhere('show.startAt >= :startAtMin', {startAtMin: listShowFilter.startAtMin});
        }

        if (listShowFilter.startAtMax) {
            query.andWhere('show.startAt <= :startAtMax', {startAtMax: listShowFilter.startAtMax});
        }

        if (listShowFilter.endAtMin) {
            query.andWhere('show.endAt >= :endAtMin', {endAtMin: listShowFilter.endAtMin});
        }

        if (listShowFilter.endAtMax) {
            query.andWhere('show.endAt <= :endAtMax', {endAtMax: listShowFilter.endAtMax});
        }
        if (listShowFilter.orderBy) {
            const direction = listShowFilter.ascending ? 'ASC' : 'DESC';
            query.orderBy(`show.${listShowFilter.orderBy}`, direction);
        }

        if (listShowFilter.movieId) {
            query.andWhere("show.movieId = :movieId", {movieId: listShowFilter.movieId});
        }

        if (listShowFilter.roomId) {
            query.andWhere("show.roomId = :roomId", {roomId: listShowFilter.roomId});
        }

        query.skip((listShowFilter.page - 1) * listShowFilter.limit);
        query.take(listShowFilter.limit);

        const [shows, totalCount] = await query.getManyAndCount();
        return {
            shows,
            totalCount
        };
    }

    async getShowById(showId: number): Promise<Show | null> {
        const showRepository = this.db.getRepository(Show);
        return await showRepository.findOne({
            where: {id: showId},
            relations: {
                room: true,
                movie: true,
            }
        });
    }

    async createShow(showData: ShowRequest): Promise<Show | Error> {
        const roomRepository = this.db.getRepository(Room);
        const movieRepository = this.db.getRepository(Movie);
        const showRepository = this.db.getRepository(Show);

        const room = await roomRepository.findOneBy({id: showData.roomId});
        const movie = await movieRepository.findOneBy({id: showData.movieId});

        if (!room) {
            return new Error(`Room ${showData.roomId} not found`);
        }
        if (!movie) {
            return new Error(`Movie ${showData.movieId} not found`);
        }

        const endAt = new Date(showData.startAt.getTime());
        endAt.setMinutes(endAt.getMinutes() + movie.duration + 30);

        const conflict = await this.hasScheduleConflict(showData.roomId, showData.startAt, endAt);
        if (conflict) {
            return new Error('Show conflicts with an existing show in the same room.');
        }

        // Création du nouveau show
        const newShow = new Show();
        newShow.room = room;
        newShow.movie = movie;
        newShow.startAt = new Date(showData.startAt);
        newShow.endAt = endAt;
        newShow.state = showData.state;

        return showRepository.save(newShow);
    }

    async updateShow(id: number, updatedShow: UpdateShowRequest): Promise<Show | null> {
        const repo = this.db.getRepository(Show);
        const roomRepository = this.db.getRepository(Room);
        const showFound = await this.getShowById(id);

        if (showFound === null) return null;

        if (updatedShow.startAt != undefined && updatedShow.startAt != showFound.startAt) {
            const endAt = new Date(updatedShow.startAt);
            endAt.setMinutes(endAt.getMinutes() + showFound.movie.duration + 30);

            const conflict = await this.hasScheduleConflict(showFound.room.id, updatedShow.startAt, endAt, showFound.id)

            if (conflict) {
                throw new Error("Error while updating : A show has conflict with new one");
            }

            showFound.startAt = updatedShow.startAt;
            showFound.endAt = endAt;
        }

        if (updatedShow.roomId != undefined && updatedShow.roomId != showFound.room.id) {
            const room = await roomRepository.findOneBy({id: updatedShow.roomId});

            if (!room) {
                throw new Error("Room " + updatedShow.roomId + "not found");
            }

            const conflic = await this.hasScheduleConflict(room.id, showFound.startAt, showFound.endAt)

            if (conflic) {
                throw new Error("Room conflict with the new show")
            }

            showFound.room = room;
        }

        if (updatedShow.state != undefined && updatedShow.state !== showFound.state) {
            showFound.state = updatedShow.state;
        }

        return await repo.save(showFound);
    }

    async deleteShow(showId: number): Promise<DeleteResult> {
        const showRepository = this.db.getRepository(Show);

        if (this.getShowById(showId) == null) {
            throw new Error(`Sho ${showId} not found`);
        }

        try {
            return await showRepository.delete(showId);
        } catch (error) {
            console.error("Failed to delete show with ID:", showId, error);
            throw error;
        }
    }

    async bookShow(showId: number, ticketId: number): Promise<boolean> {
        const showRepository = this.db.getRepository(Show);
        const ticketRepository = this.db.getRepository(Ticket);
        const ticketUseCase = new TicketUseCase(AppDataSource)
        const show = await showRepository.findOneBy({id: showId});

        if (show == null) {
            throw new Error(`Show ${showId} not found`);
        }

        const ticket = await ticketRepository.findOneBy({id: ticketId});

        if (ticket == null) {
            throw new Error(`Ticket ${ticketId} not found`);
        }

        if (ticket.used) {
            throw new Error(`Ticket ${ticketId} already used`);
        }

        const ticketData: UpdateTicketRequest = {
            showId: showId,
        };

        const result = await ticketUseCase.updateTicket(ticketId, ticketData);

        return !!result;
    }

    async getRemainingPlaces(showId: number): Promise<number> {
        const show = await this.db.getRepository(Show).findOne({
            where: {id: showId},
            relations: ["room"]
        });

        if (!show) {
            throw new Error(`Show with ID ${showId} not found`);
        }

        return show.remainingPlacesCount(this.db);
    }

    async hasScheduleConflict(roomId: number, startAt: Date, endAt: Date, showIdToExclude?: number): Promise<boolean> {
        const showRepository = this.db.getRepository(Show);
        const potShows = await showRepository.findBy({room: {id: roomId}});
        let cpt = 0;

        potShows.forEach(show => {
            if (show.id != showIdToExclude && ((show.startAt <= startAt && show.endAt >= endAt) || (show.startAt >= startAt && show.endAt <= endAt) || (show.startAt <= endAt && show.endAt >= endAt))) {
                cpt++;
            }
        })

        return cpt > 0;
    }
}
