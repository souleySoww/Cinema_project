import Joi from "joi";

export interface UserRequest {
    login: string,
    password: string,
    sold?: number,
    roles?: string,
    transactionId?: number[];
    ticketId?: number[];
}

export const userValidation = Joi.object<UserRequest>({
    login: Joi.string().min(5).required(),
    password: Joi.string().min(8).required(),
    sold: Joi.number().min(0).optional(),
    roles: Joi.string().min(1).optional(),
    transactionId: Joi.array().optional(),
    ticketId: Joi.array().optional()
}).options({abortEarly: false})


export const listUserValidation = Joi.object<ListUserRequest>({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).optional(),
})


export interface ListUserRequest {
    page?: number
    limit?: number
}

export const userIdValidator = Joi.object<UserIdValidatior>({
    id: Joi.number().required(),
})

export interface UserIdValidatior {
    id: number,
}

export interface LoginUser {
    login: string,
    password: string,
}

export const LoginUserValidation = Joi.object<LoginUser>({
    login: Joi.string().min(5).required(),
    password: Joi.string().min(8).required(),
})

export interface UpdateUserRequest {
    id: number
    login?: string,
    password?: string,
    sold?: number,
    soldTT?: number,
    roles?: string,
    transactionId?: number,
    ticketId?: number,
}

export const updateUserRequest = Joi.object<UpdateUserRequest>({
    id: Joi.number().required(),
    login: Joi.string().min(5).optional(),
    password: Joi.string().optional(),
    sold: Joi.number().optional(),
    soldTT: Joi.number().optional(),
    roles: Joi.string().optional(),
    transactionId: Joi.number().min(1).optional(),
    ticketId: Joi.number().min(1).optional,
})

