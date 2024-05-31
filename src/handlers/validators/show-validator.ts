import Joi from "joi";
import {ShowState} from "../../enumerators/ShowState";

export const showValidation = Joi.object<ShowRequest>({
    roomId: Joi.number().min(1).required(),
    movieId: Joi.number().min(1).required(),
    startAt: Joi.date().required(),
    state: Joi.string().valid(ShowState.ACTIVE, ShowState.CANCELED),
}).options({abortEarly: false})

export interface ShowRequest {
    roomId: number,
    movieId: number
    startAt: Date
    state: ShowState,
}

export const listShowsValidation = Joi.object<ListShowRequest>({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).optional(),
    ascending: Joi.boolean().optional(),
    orderBy: Joi.string().min(1).optional(),
    startAtMin: Joi.date().optional(),
    startAtMax: Joi.date().optional(),
    endAtMin: Joi.date().optional(),
    endAtMax: Joi.date().optional(),
    movieId: Joi.number().min(1).optional(),
    roomId: Joi.number().min(1).optional(),
})

export interface ListShowRequest {
    page?: number
    limit?: number
    ascending?: boolean
    orderBy?: string;
    startAtMin?: Date;
    startAtMax?: Date;
    endAtMin?: Date;
    endAtMax?: Date;
    movieId?: number;
    roomId?: number;
}

export const updateShowValidation = Joi.object<UpdateShowRequest>({
    id: Joi.number().required(),
    startAt: Joi.date().optional(),
    state: Joi.string().valid(ShowState.ACTIVE, ShowState.CANCELED).optional(),
    roomId: Joi.number().min(1).optional(),
})

export interface UpdateShowRequest {
    id: number,
    startAt?: Date,
    state?: ShowState,
    roomId?: number,
}

export const showIdValidation = Joi.object<ShowIdRequest>({
    id: Joi.number().required(),
})

export interface ShowIdRequest {
    id: number
}

export const showReservationsValidation = Joi.object<ShowReservationsRequest>({
    userId: Joi.number().required(),
})

export interface ShowReservationsRequest {
    userId: number
}

