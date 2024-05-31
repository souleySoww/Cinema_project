import express, {Request, Response} from "express";
import {ShowUsecase} from "../../domain/show-usecase";
import {AppDataSource} from "../../database/database";
import {
    listShowsValidation,
    showIdValidation,
    showReservationsValidation,
    showValidation,
    updateShowValidation
} from "../validators/show-validator";
import {generateValidationErrorMessage} from "../validators/generate-validation-message";
import {ticketIdValidation} from "../validators/ticket-validator";
import {TicketUseCase} from "../../domain/ticket-usecase";
import {authenticateJWT, isAdmin} from "../../config/auth-middleware";

export const showRoutes = (app: express.Express) => {

    // get all shows
    app.get("/shows", authenticateJWT, async (req: Request, res: Response) => {
        const validation = listShowsValidation.validate(req.query)

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const listShowRequest = validation.value
        let limit = 50
        if (listShowRequest.limit) {
            limit = listShowRequest.limit
        }
        const orderBy = listShowRequest.orderBy ?? 'id';
        const ascending = listShowRequest.ascending ?? true;
        const page = listShowRequest.page ?? 1

        try {
            const showUseCase = new ShowUsecase(AppDataSource);
            const listShows = await showUseCase.listShow({...listShowRequest, page, limit, ascending, orderBy})
            res.status(200).send(listShows)
        } catch (error) {
            console.log(error)
            res.status(500).send({error: "Internal error"})
        }
    })

    //get a show by id
    app.get("/shows/:id", authenticateJWT, async (req: Request, res: Response) => {
        try {
            const validationResult = showIdValidation.validate(req.params);
            if (validationResult.error) {
                res.status(400).send(generateValidationErrorMessage(validationResult.error.details));
                return;
            }

            const showId = validationResult.value.id;
            const showUsecase = new ShowUsecase(AppDataSource);
            const show = await showUsecase.getShowById(showId);

            if (show === null) {
                res.status(404).send({"error": `Show ${showId} not found`});
                return;
            }
            res.status(200).send(show);
        } catch (error) {
            console.log(error);
            res.status(500).send({"error": "Internal error"});
        }
    });

    // delete a show by id
    app.delete("/shows/:id", authenticateJWT, async (req: Request, res: Response) => {
        try {

            // @ts-ignore
            if (!isAdmin(req.user)) {
                return res.status(401).send("UNAUTHORIZED")
            }

            const validationResult = showIdValidation.validate(req.params)

            if (validationResult.error) {
                res.status(400).send(generateValidationErrorMessage(validationResult.error.details))
                return
            }
            const showId = validationResult.value.id
            const showUseCase = new ShowUsecase(AppDataSource);
            const result = showUseCase.deleteShow(showId);

            res.status(200).send(result);
        } catch (error) {
            console.log(error)
            res.status(500).send({error: "Internal error"})
        }
    })

    // create a show
    app.post("/shows", authenticateJWT, async (req: Request, res: Response) => {

        // @ts-ignore
        if (!isAdmin(req.user)) {
            return res.status(401).send("UNAUTHORIZED")
        }

        const validation = showValidation.validate(req.body);

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details));
            return;
        }

        const showRequest = validation.value;
        const showUseCase = new ShowUsecase(AppDataSource);

        try {
            const result = await showUseCase.createShow(showRequest);

            if (result instanceof Error) {
                res.status(400).send({"error": result.message});
                return;
            }

            res.status(201).send(result);
        } catch (error) {
            console.error(error);
            res.status(500).send({error: "Internal error"});
        }
    });

    // edit a show
    app.put("/shows/:id", authenticateJWT, async (req: Request, res: Response) => {

        // @ts-ignore
        if (!isAdmin(req.user)) {
            return res.status(401).send("UNAUTHORIZED")
        }

        const validationResult = showIdValidation.validate(req.params);

        if (validationResult.error) {
            res.status(400).send(generateValidationErrorMessage(validationResult.error.details));
            return;
        }

        const validationUpdateShow = updateShowValidation.validate(req.body);

        if (validationUpdateShow.error) {
            res.status(400).send(generateValidationErrorMessage(validationUpdateShow.error.details));
            return;
        }
        const showId = validationResult.value.id;
        const updateShow = req.body
        const showUseCase = new ShowUsecase(AppDataSource);

        try {
            const result = await showUseCase.updateShow(showId, updateShow)

            if (result) {
                res.status(200).send(result);
            } else {
                res.status(404).send({error: "Show not found or update failed."});
            }
        } catch (error: any) {
            res.status(500).send(error.message);
        }
    })

    // reserve a show
    app.put("/shows/:id/book", authenticateJWT, async (req: Request, res: Response) => {
        const validationResult = showIdValidation.validate(req.params);

        if (validationResult.error) {
            res.status(400).send(generateValidationErrorMessage(validationResult.error.details));
            return;
        }

        const ticketIdValidate = ticketIdValidation.validate(req.body);

        const showId = validationResult.value.id;
        const ticketId = ticketIdValidate.value.id;
        const showUsecase = new ShowUsecase(AppDataSource);

        try {
            const result = await showUsecase.bookShow(showId, ticketId)

            if (result) {
                res.status(200).send(result);
            } else {
                res.status(404).send({error: "Show not found or book failed."});
            }
        } catch (error) {
            res.status(500).send({error: "Internal error"});
        }
    })

    // get remaining places for a show
    app.get("/shows/:id/remaining-places", authenticateJWT, async (req, res) => {
        try {
            const showId = parseInt(req.params.id, 10);
            const showUseCase = new ShowUsecase(AppDataSource);
            const remainingPlaces = await showUseCase.getRemainingPlaces(showId);
            res.status(200).send({remainingPlaces});
        } catch (error) {
            res.status(500).send({error: "Internal error"});
        }
    });

    // get booked show
    app.get("/shows/my/reservations", authenticateJWT, async (req: Request, res: Response) => {

        const validationResult = showReservationsValidation.validate(req.query);

        if (validationResult.error) {
            res.status(400).send(generateValidationErrorMessage(validationResult.error.details));
        }

        const userId = validationResult.value.id;
        const ticketUseCase = new TicketUseCase(AppDataSource);

        try {
            const result = await ticketUseCase.getUserShows(userId);
            if (result) {
                res.status(200).send(result);
            }
        } catch (error: any) {
            res.status(500).send(error.message);
        }
    })
}