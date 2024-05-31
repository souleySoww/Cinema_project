import Joi from "joi";
import { TicketType } from "../../enumerators/TicketType";

export const ticketValidation = Joi.object<TicketRequest>({
    userId: Joi.number().min(1).required(),
    type: Joi.string().valid(TicketType.NORMAL, TicketType.SUPERTICKET).required(),
}).options({ abortEarly: false })

export interface TicketRequest {
    userId: number
    type: TicketType
}

export const listTicketValidation = Joi.object<ListTicketRequest>({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).optional(),
    userId: Joi.number().min(1).optional(),
    used: Joi.boolean().optional(),
    ticketType: Joi.string().valid(TicketType.NORMAL, TicketType.SUPERTICKET).optional(),
})


export interface ListTicketRequest {
    page?: number
    limit?: number
    userId?: number
    used?: boolean
    ticketType?: TicketType
}

export const updateTicketValidation = Joi.object<UpdateTicketRequest>({
    used: Joi.boolean().optional(),
    type: Joi.string().valid(TicketType.NORMAL, TicketType.SUPERTICKET).optional(),
    userId: Joi.number().min(1).optional(),
    showId: Joi.number().min(1).optional(),
})

export interface UpdateTicketRequest {
    used?: boolean
    type?: TicketType
    userId?: number
    showId?: number
}

export const ticketIdValidation = Joi.object<TicketIdRequest>({
    id: Joi.number().required(),
})

export interface TicketIdRequest {
    id: number
}

export interface CreateTicketUser {
    ticketType: TicketType
}

export const createTicketUser = Joi.object<CreateTicketUser>({
    ticketType: Joi.string().valid(TicketType.NORMAL, TicketType.SUPERTICKET).required(),
})