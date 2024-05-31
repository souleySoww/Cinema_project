import express, {Request, Response} from "express";
import {AppDataSource} from "../../database/database";
import {Movie} from "../../database/entities/movie";
import {MovieUseCase} from "../../domain/movie-usecase";
import {generateValidationErrorMessage} from "../validators/generate-validation-message";
import {
    listMovieValidation,
    movieIdValidation,
    MovieRequest,
    movieValidation,
    updateMovieValidation
} from "../validators/movie-validator";
import {ImageUseCase} from "../../domain/image-usecase";
import {authenticateJWT, isAdmin} from "../../config/auth-middleware";

const imageUseCase = new ImageUseCase(AppDataSource);
const uploadMiddleware = imageUseCase.getMulterMiddleware();

export const movieRoutes = (app: express.Express) => {

    //get all movies
    app.get("/movies", authenticateJWT, async (req: Request, res: Response) => {
        const validation = listMovieValidation.validate(req.query)

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return;
        }
        const listMovieRequest = validation.value

        const limit = listMovieRequest.limit ?? 10;
        const ascending = listMovieRequest.ascending ?? true;
        const page = listMovieRequest.page ?? 1;
        const orderBy = listMovieRequest.orderBy ?? 'id';  // Assume 'name' is the default field for ordering

        try {
            const movieUseCase = new MovieUseCase(AppDataSource);
            const listMovies = await movieUseCase.listMovie({...listMovieRequest, page, limit, ascending, orderBy});
            res.status(200).send(listMovies);
        } catch (error) {
            res.status(500).send({error: "Internal error"});
        }
    });

    //get a movie by id
    app.get("/movies/:id", authenticateJWT, async (req: Request, res: Response) => {
        try {
            const validationResult = movieIdValidation.validate(req.params)

            if (validationResult.error) {
                res.status(400).send(generateValidationErrorMessage(validationResult.error.details))
                return
            }

            const movieId = validationResult.value.id
            const movieUseCase = new MovieUseCase(AppDataSource)
            const movie = await movieUseCase.getMovieById(movieId);

            if (movie === null) {
                res.status(404).send({"error": `error movie ${movieId} not found`})
                return
            }
            res.status(200).send(movie)
        } catch (error) {
            res.status(500).send({"error": "Internal error"})
        }
    })

    // delete a movie by id
    app.delete("/movies/:id", authenticateJWT, async (req: Request, res: Response) => {
        try {
            // @ts-ignore
            if (!isAdmin(req.user)) {
                return res.status(401).send("UNAUTHORIZED")
            }

            const validationResult = movieIdValidation.validate(req.params)

            if (validationResult.error) {
                res.status(400).send(generateValidationErrorMessage(validationResult.error.details))
                return
            }
            const movieId = validationResult.value

            const movieRepository = AppDataSource.getRepository(Movie)
            const movie = await movieRepository.findOneBy({id: movieId.id})
            if (movie === null) {
                res.status(404).send({"error": `movie ${movieId.id} not found`})
                return
            }

            const movieDeleted = await movieRepository.remove(movie)
            res.status(200).send(movieDeleted)
        } catch (error) {
            res.status(500).send({error: "Internal error"})
        }
    })

    // create a movie
    app.post("/movies", authenticateJWT, uploadMiddleware, async (req: Request, res: Response) => {
        const validation = movieValidation.validate(req.body);

        // @ts-ignore
        if (!isAdmin(req.user)) {
            return res.status(401).send("UNAUTHORIZED")
        }

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details));
            return;
        }

        const movieRequest: MovieRequest = validation.value;
        const movieUseCase = new MovieUseCase(AppDataSource);

        try {
            const movieCreated = await movieUseCase.createMovie(movieRequest);

            if (movieCreated instanceof Error) {
                res.status(500).send({error: movieCreated.message});
                return;
            }

            if (movieCreated != null) {
                if (req.file) {
                    const uploadResult = await imageUseCase.uploadImage(req.file.path, req.file.originalname);

                    if (uploadResult instanceof Error) {
                        res.status(500).send({error: "Error uploading image"});
                        return;
                    }

                    await imageUseCase.createImage(uploadResult, movieCreated)
                }
            }
            res.status(201).send(movieCreated);
        } catch (error) {
            res.status(500).send({error: "Internal error"});
        }
    });

    // get shows of a movie
    app.get("/movies/:id/shows", authenticateJWT, async (req: Request, res: Response) => {
        const validation = movieIdValidation.validate(req.params);

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const movieIdRequest = validation.value.id
        const movieUseCase = new MovieUseCase(AppDataSource)

        try {
            const movieShows = await movieUseCase.getMovieShows(movieIdRequest)
            res.status(201).send(movieShows)
        } catch (error) {
            res.status(500).send({error: "Internal error"})
        }
    })

    // edit a movie
    app.put("/movies/:id", authenticateJWT, async (req: Request, res: Response) => {

        // @ts-ignore
        if (!isAdmin(req.user)) {
            return res.status(401).send("UNAUTHORIZED")
        }

        const validation = movieIdValidation.validate(req.params)

        if (validation.error) {
            res.status(400).send(generateValidationErrorMessage(validation.error.details))
            return
        }

        const updateMovieValidate = updateMovieValidation.validate(req.body);

        if (updateMovieValidate.error) {
            res.status(500).send(generateValidationErrorMessage(updateMovieValidate.error.details))
            return
        }

        const movieData = req.body;

        try {
            const movieUseCase = new MovieUseCase(AppDataSource)
            const updatedMovie = await movieUseCase.updateMovie(movieData);
            res.status(201).send(updatedMovie)
        } catch (error: any) {
            res.status(500).send({error: "Internal error"})
        }
    })
}