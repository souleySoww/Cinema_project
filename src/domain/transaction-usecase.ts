import { DataSource, DeleteResult } from "typeorm";
import { Transaction } from "../database/entities/transaction";
import { TransactionRequest } from "../handlers/validators/transaction-validator";
import { UserUseCase } from "./user-usecase";
import { AppDataSource } from "../database/database";
import {TransactionType} from "../enumerators/TransactionType";


export interface ListTransactionFilter {
    limit: number;
    page: number;
    userId: number;
    transactionType?: TransactionType;
    amountMin?: number;
    amountMax?: number;
}

export class TransactionUseCase {

    constructor(private readonly db: DataSource) { }

    async getTransactionById(transactionId: number): Promise<Transaction | null> {
        const transactionRepository = this.db.getRepository(Transaction);
        return await transactionRepository.findOne({
            where: { id: transactionId }
        });
    }

    async listTransaction(listTransactionFilter: ListTransactionFilter): Promise<{ transactions: Transaction[]; totalCount: number; }> {
        const query = this.db.createQueryBuilder(Transaction, 'transaction');

        query.skip((listTransactionFilter.page - 1) * listTransactionFilter.limit);
        query.take(listTransactionFilter.limit);

        if (listTransactionFilter.userId != null) {
            query.andWhere('transaction.userId = :userID', { userID: listTransactionFilter.userId })
        }

        if (listTransactionFilter.transactionType != null){
            query.andWhere('transaction.type = :type', { type: listTransactionFilter.transactionType });
        }

        if (listTransactionFilter.amountMin != null){
            query.andWhere( 'transaction.amount >= :amountMin', {amountMin: listTransactionFilter.amountMin})
        }

        if (listTransactionFilter.amountMax != null){
            query.andWhere('transaction.amount <= :amountMax', {amountMax: listTransactionFilter.amountMax})
        }

        const [transactions, totalCount] = await query.getManyAndCount();
        return { transactions, totalCount };
    }

    async deleteTransaction(transactionId: number): Promise<DeleteResult> {
        const transactionRepository = this.db.getRepository(Transaction);

        if (this.getTransactionById(transactionId) == null) {
            throw new Error(`Sho ${transactionId} not found`);
        }

        try {
            return await transactionRepository.delete(transactionId);
        } catch (error) {
            console.error("Failed to delete transaction with ID:", transactionId, error);
            throw error;
        }
    }

    async createTransaction(transactionData: TransactionRequest): Promise<Transaction | Error> {
        const userUseCase = new UserUseCase(AppDataSource);
        const transactionRepository = this.db.getRepository(Transaction);

        const user = await userUseCase.getUserById(transactionData.userId);

        if (!user) {
            throw new Error(`User ${transactionData.userId} not found`);
        }

        const newTransaction = new Transaction();
        newTransaction.user = user;
        newTransaction.amount = transactionData.amount;
        newTransaction.createdAt = new Date();
        newTransaction.type = transactionData.type;

        return await transactionRepository.save(newTransaction);
    }

}