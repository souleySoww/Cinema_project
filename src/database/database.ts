import { DataSource } from "typeorm";


export const AppDataSource = new DataSource({
    type: "mysql",
    host: "34.163.75.204",
    port: 3306,
    username: "root",
    password: "{>-tYn*$:3nM[Dg_",
    database: "cinema",
    logging: true, 
    synchronize: true,
    entities: [
        "src/database/entities/*.ts" 
    ], 
    migrations: [ 
        "src/database/migrations/*.ts"
    ]
})