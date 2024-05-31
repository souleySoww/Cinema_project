import {NextFunction, Request, Response} from "express";
import {VerifyErrors} from "jsonwebtoken";
import {UserUseCase} from "../domain/user-usecase";
import {AppDataSource} from "../database/database";

const jwt = require('jsonwebtoken');

const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        // @ts-ignore
        jwt.verify(token, process.env.JWT_SECRET as string, (err: VerifyErrors | null, user: object | undefined) => {
            if (err) {
                return res.sendStatus(403);
            }

            // @ts-ignore
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

const isAdmin = async (user: any) => {
    try {
        const userUseCase = new UserUseCase(AppDataSource);
        const userDb = await userUseCase.getUserById(user.userId);

        if (!user) {
            return false;
        }
        // @ts-ignore
        const roles = userDb.roles.split(";");
        return roles.includes("admin")
    } catch (error) {
        return false;
    }
}
export {authenticateJWT, isAdmin};
