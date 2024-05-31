import express from "express";
import {AppDataSource} from "./database/database";
import {showRoutes} from "./handlers/routes/shows-route";
import {movieRoutes} from "./handlers/routes/movies-route";
import {roomRoutes} from "./handlers/routes/rooms-route";
import {ticketRoutes} from "./handlers/routes/tickets-route";
import {userRoutes} from "./handlers/routes/users-route";
import {transactionRoutes} from "./handlers/routes/transactions-route";
import path from "path";
import {statsRoutes} from "./handlers/routes/stats-route";
import swaggerUi from 'swagger-ui-express';

require('dotenv').config();
const swaggerDocument = require('./swaggerConfig.json');
const logger: any = require('./config/logger');
const cors = require('cors');


const main = async () => {
    const app = express();
    const port = 3000;

    try {
        await AppDataSource.initialize();
        console.error("well connected to database");
    } catch (error) {
        console.error("Cannot contact database");
        process.exit(1);
    }

    if (!process.env.JWT_SECRET) {
        process.exit(1);
    }

    app.use(cors({
        origin: '*'
    }));

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    app.use('/static', express.static(path.join(__dirname, 'src', 'images')));
    app.use(express.json());

    app.use((req, res, next) => {
        res.on('finish', () => {
            const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            logger.info(`${clientIp} - ${req.method} ${req.originalUrl} ${res.statusCode} `);
        });

        next();
    });

    showRoutes(app);
    movieRoutes(app);
    ticketRoutes(app);
    roomRoutes(app);
    userRoutes(app);
    transactionRoutes(app);
    statsRoutes(app);

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

main();