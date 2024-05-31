import {DataSource} from "typeorm";
import {Show} from "../database/entities/show";
import {Stats} from "../database/entities/Stats";
import {AppDataSource} from "../database/database";

export interface ListStatsFilter {
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
    visitCountMin?: number;
    visitCountMax?: number;
}

export class StatsUseCase {
    constructor(private readonly db: DataSource) {
    }

    async listStats(listStatsFilter: ListStatsFilter): Promise<Stats | null> {
        const query = this.db.createQueryBuilder(Show, 'show');

        query.leftJoinAndSelect('show.room', 'room');
        query.leftJoinAndSelect('show.movie', 'movie');
        query.leftJoinAndSelect('movie.image', 'image');

        if (listStatsFilter.startAtMin) {
            query.andWhere('show.startAt >= :startAtMin', {startAtMin: listStatsFilter.startAtMin});
        }

        if (listStatsFilter.startAtMax) {
            query.andWhere('show.startAt <= :startAtMax', {startAtMax: listStatsFilter.startAtMax});
        }

        if (listStatsFilter.endAtMin) {
            query.andWhere('show.endAt >= :endAtMin', {endAtMin: listStatsFilter.endAtMin});
        }

        if (listStatsFilter.endAtMax) {
            query.andWhere('show.endAt <= :endAtMax', {endAtMax: listStatsFilter.endAtMax});
        }
        if (listStatsFilter.orderBy) {
            const direction = listStatsFilter.ascending ? 'ASC' : 'DESC';
            query.orderBy(`show.${listStatsFilter.orderBy}`, direction);
        }

        if (listStatsFilter.movieId) {
            query.andWhere("show.movieId = :movieId", {movieId: listStatsFilter.movieId});
        }

        if (listStatsFilter.roomId) {
            query.andWhere("show.roomId = :roomId", {roomId: listStatsFilter.roomId});
        }

        query.skip((listStatsFilter.page - 1) * listStatsFilter.limit);
        query.take(listStatsFilter.limit);

        const shows = await query.getMany();
        const filteredShows: Show[] = [];

        if (shows.length <= 0) {
            return null;
        }

        let stats = new Stats();
        let totalVisitors = 0;

        for (const show of shows) {
            let tmp = await show.remainingPlacesCount(AppDataSource);
            show.visitCount = show.room.capacity - tmp;

            if (listStatsFilter.visitCountMin && listStatsFilter.visitCountMin >= 0 && show.visitCount < listStatsFilter.visitCountMin) {
                continue;
            }

            if (listStatsFilter.visitCountMax && listStatsFilter.visitCountMax >= 0 && show.visitCount > listStatsFilter.visitCountMax) {
                continue;
            }

            filteredShows.push(show)
        }

        let mostPopularShow: Show = filteredShows[0];
        for (const show of filteredShows) {
            totalVisitors += show.visitCount;
            if (mostPopularShow.visitCount <= show.visitCount) {
                mostPopularShow = show;
            }
        }

        stats.shows = filteredShows;
        stats.visitsCount = totalVisitors;
        // @ts-ignore
        stats.mostPopularShow = mostPopularShow;

        return stats;
    }
}