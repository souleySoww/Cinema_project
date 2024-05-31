import express, {Request, Response} from "express";
import {
    listTransactionValidation,
    transactionIdValidation,
    transactionValidation
} from "../validators/transaction-validator";
import {TransactionUseCase} from "../../domain/transaction-usecase";
import {AppDataSource} from "../../database/database";
import {generateValidationErrorMessage} from "../validators/generate-validation-message";
import {authenticateJWT} from "../../config/auth-middleware";

export const transactionRoutes = (app: express.Express) => {

    //get all transactions
    app.get("/transactions", authenticateJWT, async (req: Request, res: Response) => {

        const validation = listTransactionValidation.validate(req.query)

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
        }
        const listTransactionsRequest = validation.value

        if (listTransactionsRequest.userId) {
            // @ts-ignore
            if (listTransactionsRequest.userId != req.user.userId && !isAdmin(req.user)) {
                return res.status(401).send("UNAUTHORIZED")
            }
        }

        let limit = 50
        if (listTransactionsRequest.limit)
            limit = listTransactionsRequest.limit

        const page = listTransactionsRequest.page ?? 1

        try {
            const transactionUseCase = new TransactionUseCase(AppDataSource)
            const listTransaction = await transactionUseCase.listTransaction({...listTransactionsRequest, page, limit})
            res.status(200).send(listTransaction)
        } catch (error) {
            res.status(500).send({error: "Internal error"})
        }
    })

    //get by id
    app.get("/transactions/:id", authenticateJWT, async (req: Request, res: Response) => {

        try {
            const validation = transactionIdValidation.validate(req.params)

            if (validation.error) {
                res.status(400).send(generateValidationErrorMessage(validation.error.details))
                return
            }

            const transactionId = validation.value.id
            const transactionUseCase = new TransactionUseCase(AppDataSource);
            const result = await transactionUseCase.getTransactionById(transactionId);

            // @ts-ignore
            if (result?.user.id != req.user.id && !isAdmin(req.user)) {
                return res.status(401).send("UNAUTHORIZED")
            }

            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({error: "Internal error"})
        }
    })

    //delete by id
    app.delete("/transactions/:id", authenticateJWT, async (req: Request, res: Response) => {
        try {
            const validationResult = transactionIdValidation.validate(req.params)

            if (validationResult.error) {
                res.status(400).send(generateValidationErrorMessage(validationResult.error.details))
                return
            }
            const transactionId = validationResult.value.id
            const transactionUseCase = new TransactionUseCase(AppDataSource);

            const transaction = await transactionUseCase.getTransactionById(transactionId);

            // @ts-ignore
            if (transaction?.user.id != req.user.id && !isAdmin(req.user)) {
                return res.status(401).send("UNAUTHORIZED")
            }

            const result = transactionUseCase.deleteTransaction(transactionId);

            res.status(200).send(result);
        } catch (error) {
            console.log(error)
            res.status(500).send({error: "Internal error"})
        }
    })

    //create transaction
    app.post("/transactions", authenticateJWT, async (req: Request, res: Response) => {

        // @ts-ignore
        if (!isAdmin(req.user)) {
            return res.status(401).send("UNAUTHORIZED")
        }

        const validation = transactionValidation.validate(req.body)

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const transactionRequested = validation.value
        const transactionUseCase = new TransactionUseCase(AppDataSource);

        if (transactionUseCase)

            try {
                const result = await transactionUseCase.createTransaction(transactionRequested);
                return res.status(201).send(result);
            } catch (error) {
                console.log(error)
                res.status(500).send({"error": "internal error retry later"})
                return
            }
    })

}
