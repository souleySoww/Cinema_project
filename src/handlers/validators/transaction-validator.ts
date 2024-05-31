import Joi from "joi";
import {TransactionType} from "../../enumerators/TransactionType";
import {TicketType} from "../../enumerators/TicketType";

export const transactionValidation = Joi.object<TransactionRequest>({
    userId: Joi.number().min(1).required(),
    amount: Joi.number().required(),
    type: Joi.string().valid(TransactionType.DEPOSIT, TransactionType.PURCHASE, TransactionType.WITHDRAWAL),
    createdAt: Joi.date().optional(),

}).options({abortEarly: false})

export interface TransactionRequest {
    createdAt: Date;
    userId: number;
    amount: number;
    type: TransactionType;
}

export const listTransactionValidation = Joi.object<ListTransactionRequest>({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).optional(),
    userId: Joi.number().min(1).optional(),
    amountMax: Joi.number().min(1).optional(),
    amountMin: Joi.number().min(1).optional(),
    transactionType: Joi.string().valid(TransactionType.DEPOSIT, TransactionType.PURCHASE, TransactionType.WITHDRAWAL),
})


export interface ListTransactionRequest {
    page?: number
    limit?: number
    userId?: number
    amountMax?: number
    amountMin?: number
    transactionType?: TicketType
}

export const updateTransactionValidation = Joi.object<UpdateTransactionRequest>({
    id: Joi.number().required(),
    name: Joi.string()
        .min(3)
        .optional(),
    amount: Joi.number().optional(),
    createdAt: Joi.date().optional()

})

export interface UpdateTransactionRequest {
    id: number
    name?: string,
    amount?: number;
    createdAt?: Date;
}

export const transactionIdValidation = Joi.object<TransactionIdRequest>({
    id: Joi.number().required(),
})

export interface TransactionIdRequest {
    id: number
}
