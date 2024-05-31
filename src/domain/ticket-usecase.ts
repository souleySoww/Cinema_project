import {DataSource} from "typeorm";
import {Ticket} from "../database/entities/ticket";
import {TicketRequest, UpdateTicketRequest} from "../handlers/validators/ticket-validator";
import {User} from "../database/entities/user";
import {Show} from "../database/entities/show";
import {TicketType} from "../enumerators/TicketType";
import {TransactionType} from "../enumerators/TransactionType";
import {Transaction} from "../database/entities/transaction";

export interface ListTicketFilter {
    page: number
    limit: number
    userId: number
    used?: boolean
    ticketType?: TicketType
}

export class TicketUseCase {
    constructor(private readonly db: DataSource) {
    }

    async listTicket(listTicketFilter: ListTicketFilter): Promise<{ tickets: Ticket[]; totalCount: number; }> {
        const query = this.db.createQueryBuilder(Ticket, 'ticket');

        query.leftJoinAndSelect('ticket.shows', 'show');
        query.leftJoinAndSelect('show.movie', 'movie');
        query.skip((listTicketFilter.page - 1) * listTicketFilter.limit);
        query.take(listTicketFilter.limit);

        if (listTicketFilter.userId != null) {
            query.andWhere('ticket.userId = :userID', {userID: listTicketFilter.userId})
        }

        if (listTicketFilter.used != null) {
            query.andWhere('ticket.used = :used', {used: listTicketFilter.used})
        }

        if (listTicketFilter.ticketType != null) {
            query.andWhere('ticket.type = :type', {type: listTicketFilter.ticketType})
        }

        const [tickets, totalCount] = await query.getManyAndCount();
        return {tickets, totalCount};
    }

    async createTicket(ticketData: TicketRequest): Promise<Ticket | Error> {
        const repo = this.db.getRepository(Ticket);
        const userRepo = this.db.getRepository(User);
        const transactionRepo = this.db.getRepository(Transaction);

        const user = await userRepo.findOneBy({id: ticketData.userId});

        if (user == null) {
            return new Error("Asksed user is unknown");
        }

        const newTicket = new Ticket();
        newTicket.type = ticketData.type;
        newTicket.user = user;
        newTicket.shows = [];
        newTicket.used = false;

        const ticket = await repo.save(newTicket);

        let transactionData = new Transaction();

        if (ticket.type == TicketType.NORMAL) {
            transactionData.amount = 10
        } else if (ticket.type == TicketType.SUPERTICKET) {
            transactionData.amount = 90
        }

        transactionData.type = TransactionType.PURCHASE;
        transactionData.createdAt = new Date();
        transactionData.user = user;

        await transactionRepo.save(transactionData);
        return ticket;

    }

    async getTicketById(ticketId: number): Promise<Ticket | null> {
        const ticketRepository = this.db.getRepository(Ticket);

        return await ticketRepository.findOne({
            where: {id: ticketId},
            relations: {
                user: true,
            }
        });
    }

    async updateTicket(ticketId: number, ticketData: UpdateTicketRequest): Promise<Ticket | null> {
        const ticketRepo = this.db.getRepository(Ticket);
        const showRepo = this.db.getRepository(Show);
        const userRepo = this.db.getRepository(User);

        const ticket = await ticketRepo.findOne({
            where: {id: ticketId},
            relations: ["shows"]
        });

        if (!ticket) {
            throw new Error("Ticket not found.");
        }

        if (ticketData.used !== undefined) ticket.used = ticketData.used;
        if (ticketData.type) ticket.type = ticketData.type;
        if (ticketData.userId) {
            const user = await userRepo.findOneBy({id: ticketData.userId});
            if (!user) {
                throw new Error("User not found.");
            }
            ticket.user = user;
        }

        if (ticketData.showId) {
            const show = await showRepo.findOneBy({id: ticketData.showId});
            if (!show) {
                throw new Error("Show not found.");
            }

            const existingShowIndex = ticket.shows.findIndex(s => s.id === show.id);
            if (existingShowIndex > -1) {
                ticket.shows.splice(existingShowIndex, 1);
            } else {
                ticket.shows.push(show);
            }
        }

        if (ticket.type === TicketType.NORMAL) {
            ticket.used = ticket.shows.length == 1;
        } else if (ticket.type === TicketType.SUPERTICKET) {
            ticket.used = ticket.shows.length == 10;
        }

        return await ticketRepo.save(ticket);
    }

    async getUserShows(userId: number): Promise<Show[]> {
        const ticketRepository = this.db.getRepository(Ticket);
        let shows: Show[] = []
        const tickets = await ticketRepository.find({
            where: {user: {id: userId}},
            relations: ["shows", "shows.movie", "shows.room"],
        });

        if (tickets != null && tickets.length > 0) {
            for (const ticket of tickets) {
                if (ticket.shows != null && ticket.shows.length > 0) {
                    for (const show of ticket.shows) {
                        shows.push(show);
                    }
                }
            }
        }

        return shows;
    }

}