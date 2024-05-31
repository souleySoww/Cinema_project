import {DataSource} from "typeorm";
import {User} from "../database/entities/user";
import {UpdateUserRequest, UserRequest} from "../handlers/validators/user-validator";
import {hash} from "bcrypt";
import {Ticket} from "../database/entities/ticket";
import {Transaction} from "../database/entities/transaction";
import {ListTransactionFilter, TransactionUseCase} from "./transaction-usecase";
import {AppDataSource} from "../database/database";
import {TicketType} from "../enumerators/TicketType";
import {ListTicketFilter, TicketUseCase} from "./ticket-usecase";
import {ticketValidation} from "../handlers/validators/ticket-validator";
import {TransactionType} from "../enumerators/TransactionType";
import {Repository} from "typeorm/repository/Repository";
import {transactionValidation} from "../handlers/validators/transaction-validator";


export interface ListUserCase {
    limit: number;
    page: number;
}

export class UserUseCase {

    constructor(private readonly db: DataSource) {
    }

    async listUser(listuser: ListUserCase): Promise<{ user: User[], total: number }> {
        const query = this.db.getRepository(User).createQueryBuilder('user');

        query.skip((listuser.page - 1) * listuser.limit);
        query.take(listuser.limit);

        const [user, total] = await query.getManyAndCount();
        for (let u of user) {
            u.password = "{noop}"
        }

        return {
            user,
            total
        };
    }

    async createUser(userData: UserRequest): Promise<User | Error> {

        const userRepository = this.db.getRepository(User);
        const transactionRepository = this.db.getRepository(Transaction);
        const ticketRepository = this.db.getRepository(Ticket);
        let transactions: Transaction[] = [];
        let tickets: Ticket[] = [];

        const newUser = new User();
        newUser.login = userData.login;
        newUser.password = await hash(userData.password, 10);

        if (userData.roles) {
            newUser.roles = userData.roles;
        } else {
            newUser.roles = ' user';
        }

        newUser.createdAt = new Date();

        if (userData.sold != null) {
            newUser.sold = userData.sold;
        } else {
            newUser.sold = 0;
        }

        if (userData.transactionId != null) {
            transactions = await this.resolveTransactions(userData.transactionId, transactionRepository);
        }

        newUser.transactions = transactions;

        if (userData.ticketId != null) {
            tickets = await this.resolveTickets(userData.ticketId, ticketRepository);
        }

        newUser.tickets = tickets;
        return userRepository.save(newUser);
    }

    async getUserById(userId: number): Promise<User | null> {
        const userRepository = this.db.getRepository(User);
        const result = await userRepository.findOne({
            where: {id: userId}
        });
        if (!result) {
            throw new Error(`User with id ${userId} not found`);
        }
        result.password = "{noop}"
        return result;
    }

    async getTransactionsFromUserId(userId: number): Promise<Transaction[] | null> {
        const user = await this.getUserById(userId);
        if (!user) {
            return null;
        }

        const listTransactionFilter: ListTransactionFilter = {
            limit: 50,
            page: 1,
            userId: userId
        };

        const transactionUseCase = new TransactionUseCase(AppDataSource);
        const result = await transactionUseCase.listTransaction(listTransactionFilter);

        return result.transactions;
    }

    async getTicketsFromUserId(userId: number): Promise<Ticket[] | null> {
        const user = await this.getUserById(userId);
        if (!user) {
            return null;
        }

        const listTicketFilter: ListTicketFilter = {
            limit: 50,
            page: 1,
            userId: userId,

        };

        const ticketUseCase = new TicketUseCase(AppDataSource);
        ;
        const result = await ticketUseCase.listTicket(listTicketFilter);

        return result.tickets;
    }

    async updateUser(userId: number, userData: UpdateUserRequest): Promise<User | Error> {
        const userRepo = this.db.getRepository(User);
        const ticketRepo = this.db.getRepository(Ticket);
        const transactionUseCase = new TransactionUseCase(AppDataSource);
        const transactionRepo = this.db.getRepository(Transaction)

        const user = await userRepo.findOne({
            where: {id: userId},
            relations: {
                transactions: true,
                tickets: true,
            }
        })

        if (!user) {
            return new Error("User " + userId + " not found")
        }
        if (userData.login && userData.login != user.login) {
            user.login = userData.login;
        }
        if (userData.password && userData.password != user.password) {
            user.password = await hash(userData.password, 10);
        }
        if (userData.roles && userData.roles != user.roles) {

            const newRolesSet = new Set(userData.roles.split(';').filter(role => role.trim()));

            user.roles = Array.from(newRolesSet).join(';');
        }
        if (userData.sold) {
            const newSold = user.sold + userData.sold;
            let transaction: any = {
                createdAt: new Date(),
                userId: user.id
            };

            if (newSold < 0) {
                throw new Error("User does not have enough sold");
            }

            user.sold = newSold;
            transaction.amount = userData.sold;
            if (userData.sold < 0) {
                transaction.type = TransactionType.WITHDRAWAL
            }
            if (userData.sold > 0) {
                transaction.type = TransactionType.DEPOSIT
            }

            const transactionData = transactionValidation.validate(transaction)

            transactionUseCase.createTransaction(transactionData.value)
        }
        if (userData.soldTT != null) {
            user.sold = userData.soldTT
        }
        if (userData.ticketId) {
            const ticket = await ticketRepo.findOneBy({id: userData.ticketId})

            if (!ticket) {
                throw new Error("Ticket " + userData.ticketId + " not found")
            }

            const userTickets = new Set(user.tickets);

            if (userTickets.has(ticket)) {
                userTickets.delete(ticket);
            } else {
                userTickets.add(ticket);
            }

            user.tickets = Array.from(userTickets);
        }
        if (userData.transactionId) {
            const transaction = await transactionRepo.findOneBy({id: userData.transactionId})

            if (!transaction) {
                throw new Error("transaction " + userData.transactionId + " not found")
            }

            const userTransactions = new Set(user.transactions);

            if (userTransactions.has(transaction)) {
                userTransactions.delete(transaction);
            } else {
                userTransactions.add(transaction);
            }

            user.transactions = Array.from(userTransactions);
        }
        return await userRepo.save(user);
    }

    async createUserTicket(userId: number, ticketType: TicketType): Promise<User | Error> {

        const userRepo = this.db.getRepository(User);
        const ticketUseCase = new TicketUseCase(AppDataSource);
        const user = await userRepo.findOneBy({id: userId});

        if (!user) {
            throw new Error("User " + userId + " not found")
        }

        let ticket: any = {
            type: ticketType,
            userId: user.id,
        }

        const sold = user.sold;

        if (!sold || sold < 10) {
            throw new Error("Not enough sold, please credit it")
        } else if (ticket.type.ticketType == TicketType.NORMAL) {
            if (sold < 10) {
                throw new Error("Not enough sold, please credit it")
            }
            user.sold -= 10
        } else if (ticket.type.ticketType == TicketType.SUPERTICKET) {
            if (sold < 90) {
                throw new Error("Not enough sold, please credit it")
            }
            user.sold -= 90
        }

        ticket.type = ticket.type.ticketType
        const ticketValidate = ticketValidation.validate(ticket)

        if (ticketValidate.error) {
            throw new Error(ticketValidate.error.message)
        }
        const ticketValue = ticketValidate.value

        await ticketUseCase.createTicket(ticketValue);

        return userRepo.save(user);
    }

    async resolveTransactions(transactionIds: number[], transactionRepository: Repository<Transaction>): Promise<Transaction[]> {
        const transactions = await Promise.all(
            transactionIds.map(id => transactionRepository.findOne({where: {id}}))
        );
        return transactions.filter((t): t is Transaction => t !== null);
    }

    async resolveTickets(ticketIds: number[], ticketRepository: Repository<Ticket>): Promise<Ticket[]> {
        const tickets = await Promise.all(
            ticketIds.map(id => ticketRepository.findOne({where: {id}}))
        );
        return tickets.filter((t): t is Ticket => t !== null);
    }
}