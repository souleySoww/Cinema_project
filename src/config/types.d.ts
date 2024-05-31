import 'express';
import {User} from "../database/entities/user";

declare module 'express-serve-static-core' {
    export interface Request {
        user?: User;
    }
}
