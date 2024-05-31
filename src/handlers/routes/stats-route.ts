import express, {Request, Response} from "express";
import {AppDataSource} from "../../database/database";
import {generateValidationErrorMessage} from "../validators/generate-validation-message";
import {StatsUseCase} from "../../domain/stats-usecase";
import {ListStatsValidation} from "../validators/stats-validator";
import {authenticateJWT, isAdmin} from "../../config/auth-middleware";

export const statsRoutes = (app: express.Express) => {

    // get all stats
    app.get("/stats", authenticateJWT, async (req: Request, res: Response) => {

        // @ts-ignore
        if (!isAdmin(req.user)) {
            return res.status(401).send("UNAUTHORIZED")
        }

        const validation = ListStatsValidation.validate(req.query)

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const listStatsRequest = validation.value
        let limit = 50
        if (listStatsRequest.limit) {
            limit = listStatsRequest.limit
        }
        const orderBy = listStatsRequest.orderBy ?? 'id';
        const ascending = listStatsRequest.ascending ?? true;
        const page = listStatsRequest.page ?? 1

        try {
            const statsUseCase = new StatsUseCase(AppDataSource);
            const listShows = await statsUseCase.listStats({...listStatsRequest, page, limit, ascending, orderBy})
            res.status(200).send(listShows)
        } catch (error) {
            console.log(error)
            res.status(500).send({error: "Internal error"})
        }
    })
}