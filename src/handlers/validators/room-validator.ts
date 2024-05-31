import Joi from "joi";

export const roomValidation = Joi.object<RoomRequest>({
    name: Joi.string()
        .min(1)
        .required(),
    description: Joi.string()
        .min(5)
        .required(),
    type: Joi.string()
        .min(1)
        .required(),
    state: Joi.boolean().required(),
    handicapAvailable: Joi.boolean().required(),
    capacity: Joi.number().min(15).max(30).required(),

}).options({abortEarly: false})

export interface RoomRequest {
    name: string
    description: string
    type: string
    state: boolean
    handicapAvailable: boolean
    capacity: number
}

export const listRoomValidation = Joi.object<ListRoomRequest>({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).optional(),
    ascending: Joi.boolean().optional(),
    orderBy: Joi.string().min(1).optional(),
})


export interface ListRoomRequest {
    page?: number
    limit?: number
    ascending?: boolean
    orderBy?: string;
}

export const updateRoomValidation = Joi.object<UpdateRoomRequest>({
    id: Joi.number().required(),
    name: Joi.string()
        .min(1)
        .optional(),
    description: Joi.string()
        .min(5)
        .optional(),
    type: Joi.string()
        .min(1)
        .optional(),
    state: Joi.boolean().optional(),
    handicapAvailable: Joi.boolean().optional(),
})

export interface UpdateRoomRequest {
    id: number
    name?: string
    description?: string
    type?: string
    state?: boolean
    handicapAvailable?: boolean
}

export const roomIdValidation = Joi.object<RoomIdRequest>({
    id: Joi.number().required(),
})

export interface RoomIdRequest {
    id: number
}
