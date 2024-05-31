import Joi from "joi";
import {Image} from "../../database/entities/image";

export const movieValidation = Joi.object<MovieRequest>({
    name: Joi.string()
        .min(3)
        .required(),
    description: Joi.string()
        .min(5)
        .required(),
    duration: Joi.number().min(1).required(),
}).options({abortEarly: false})

export interface MovieRequest {
    name: string
    description: string
    duration: number
}

export const listMovieValidation = Joi.object<ListMovieRequest>({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).optional(),
    ascending: Joi.boolean().optional(),
    orderBy: Joi.string().min(1).optional(),
    name: Joi.string().min(1).optional(),
})


export interface ListMovieRequest {
    page?: number
    limit?: number
    ascending?: boolean
    orderBy?: string
    name?: string
}

export const updateMovieValidation = Joi.object<UpdateMovieRequest>({
    id: Joi.number().required(),
    name: Joi.string()
        .min(3)
        .optional(),
    description: Joi.string()
        .min(5)
        .optional(),
    duration: Joi.number().min(1).optional(),
})

export interface UpdateMovieRequest {
    id: number,
    name?: string,
    description?: string,
    duration?: number,
}

export const movieIdValidation = Joi.object<MovieIdRequest>({
    id: Joi.number().required(),
})

export interface MovieIdRequest {
    id: number
}
