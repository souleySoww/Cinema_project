import {Show} from "./show";

export class Stats {
    shows: Show[] = [];
    visitsCount: number = 0;
    mostPopularShow = null;

    constructor(shows?: Show[], visitsCount?: number, mostPopularShow?: any) {
        if (shows) this.shows = shows;
        if (visitsCount) this.visitsCount = visitsCount;
        if (mostPopularShow) this.mostPopularShow = mostPopularShow;
    }

}