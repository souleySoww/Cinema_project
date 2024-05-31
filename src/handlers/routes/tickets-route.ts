import express, {Request, Response} from "express";
import {AppDataSource} from "../../database/database";
import {Ticket} from "../../database/entities/ticket";
import {TicketUseCase} from "../../domain/ticket-usecase";
import {generateValidationErrorMessage} from "../validators/generate-validation-message";
import {
    listTicketValidation,
    ticketIdValidation,
    ticketValidation,
    updateTicketValidation
} from "../validators/ticket-validator";
import {authenticateJWT, isAdmin} from "../../config/auth-middleware";

export const ticketRoutes = (app: express.Express) => {

    //get all tickets
    app.get("/tickets", authenticateJWT, async (req: Request, res: Response) => {
        const validation = listTicketValidation.validate(req.query)

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
        }
        const listTicketsRequest = validation.value

        let limit = 50
        if (listTicketsRequest.limit)
            limit = listTicketsRequest.limit

        const page = listTicketsRequest.page ?? 1

        if (listTicketsRequest.userId) {
            // @ts-ignore
            if (listTicketsRequest.userId != req.user.userId && !isAdmin(req.user)) {
                return res.status(401).send("UNAUTHORIZED")
            }
        }

        try {
            const ticketUseCase = new TicketUseCase(AppDataSource)
            const listTicket = await ticketUseCase.listTicket({...listTicketsRequest, page, limit})
            res.status(200).send(listTicket)
        } catch (error) {
            console.log(error)
            res.status(500).send({error: "Internal error"})
        }
    })

    //get a ticket by id
    app.get("/tickets/:id", authenticateJWT, async (req: Request, res: Response) => {

        const validation = ticketIdValidation.validate(req.params)

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
        }

        const ticketId = validation.value.id
        const ticketUseCase = new TicketUseCase(AppDataSource);

        try {
            const ticket = await ticketUseCase.getTicketById(
                ticketId
            )
            res.status(201).send(ticket)
        } catch (error) {
            res.status(500).send({error: "Internal error"})
        }


    })

    // delete a ticket by id
    app.delete("/tickets/:id", authenticateJWT, async (req: Request, res: Response) => {
        try {

            // @ts-ignore
            if (!isAdmin(req.user)) {
                return res.status(401).send("UNAUTHORIZED")
            }

            const validationResult = ticketIdValidation.validate(req.params)

            if (validationResult.error) {
                res.status(400).send(generateValidationErrorMessage(validationResult.error.details))
                return
            }
            const ticketId = validationResult.value

            const ticketRepository = AppDataSource.getRepository(Ticket)
            const ticket = await ticketRepository.findOneBy({id: ticketId.id})
            if (ticket === null) {
                res.status(404).send({"error": `ticket ${ticketId.id} not found`})
                return
            }

            const ticketDeleted = await ticketRepository.remove(ticket)
            res.status(200).send(ticketDeleted)
        } catch (error) {
            console.log(error)
            res.status(500).send({error: "Internal error"})
        }
    })

    app.post("/tickets", authenticateJWT, async (req: Request, res: Response) => {
        const validation = ticketValidation.validate(req.body)

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const ticketRequest = validation.value;
        const ticketUseCase = new TicketUseCase(AppDataSource);

        try {
            const ticketCreated = await ticketUseCase.createTicket(ticketRequest)
            res.status(201).send(ticketCreated)
        } catch (error) {
            res.status(500).send({error: "Internal error"})
        }
    })

    app.put("/tickets/:id", authenticateJWT, async (req: Request, res: Response) => {
        const ticketIdValide = ticketIdValidation.validate(req.params)

        if (ticketIdValide.error) {
            res.status(400).send(generateValidationErrorMessage(ticketIdValide.error.details));
            return;
        }

        const ticketId = ticketIdValide.value.id
        const ticketData = req.body;
        const validation = updateTicketValidation.validate(ticketData);

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details));
            return;
        }

        const ticketUseCase = new TicketUseCase(AppDataSource);

        try {
            const updatedTicket = await ticketUseCase.updateTicket(ticketId, ticketData);

            if (updatedTicket) {
                res.status(200).send(updatedTicket);
            } else {
                res.status(404).send({error: "Ticket not found or update failed."});
            }
        } catch (error) {
            console.error("Update Ticket Error:", error);
            res.status(500).send({error: "Internal error"});
        }
    });

}