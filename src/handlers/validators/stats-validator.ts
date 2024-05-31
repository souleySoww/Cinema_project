import Joi from "joi";

export const ListStatsValidation = Joi.object<ListStatsRequest>({
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
    visitCountMin: Joi.number().min(0).optional(),
    visitCountMax: Joi.number().min(0).optional(),
})

export interface ListStatsRequest {
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
    visitCountMin?: number;
    visitCountMax?: number;

}
