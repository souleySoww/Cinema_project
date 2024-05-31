import { MigrationInterface, QueryRunner } from "typeorm";

export class InitializeDatabase1715033953419 implements MigrationInterface {
    name = 'InitializeDatabase1715033953419'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`transaction\` (\`id\` int NOT NULL AUTO_INCREMENT, \`amount\` int NOT NULL, \`type\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`room\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, \`type\` varchar(255) NOT NULL, \`state\` tinyint NOT NULL, \`handicapAvailable\` tinyint NOT NULL, \`capacity\` int NOT NULL, UNIQUE INDEX \`IDX_535c742a3606d2e3122f441b26\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`image\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`path\` varchar(255) NOT NULL, \`type\` varchar(255) NOT NULL, \`movieId\` int NULL, UNIQUE INDEX \`IDX_e4dfc6a6f95452c9c931f5df48\` (\`name\`), UNIQUE INDEX \`REL_f9ca629edc61a86c266d14eb8d\` (\`movieId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`movie\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, \`duration\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`show\` (\`id\` int NOT NULL AUTO_INCREMENT, \`startAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`endAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`state\` varchar(255) NOT NULL, \`roomId\` int NULL, \`movieId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`ticket\` (\`id\` int NOT NULL AUTO_INCREMENT, \`type\` varchar(255) NOT NULL, \`used\` tinyint NOT NULL, \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`login\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`sold\` int NOT NULL, \`roles\` text NOT NULL, UNIQUE INDEX \`IDX_a62473490b3e4578fd683235c5\` (\`login\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`ticket_shows_show\` (\`ticketId\` int NOT NULL, \`showId\` int NOT NULL, INDEX \`IDX_6e7c5cf7e6b6b04ce13f606a9d\` (\`ticketId\`), INDEX \`IDX_513d24b8fe0a3576464cb2b7c5\` (\`showId\`), PRIMARY KEY (\`ticketId\`, \`showId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`transaction\` ADD CONSTRAINT \`FK_605baeb040ff0fae995404cea37\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`image\` ADD CONSTRAINT \`FK_f9ca629edc61a86c266d14eb8df\` FOREIGN KEY (\`movieId\`) REFERENCES \`movie\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`show\` ADD CONSTRAINT \`FK_d0de168ac3191ccda28b7224c7d\` FOREIGN KEY (\`roomId\`) REFERENCES \`room\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`show\` ADD CONSTRAINT \`FK_9f463fbeea3edaba1061f97e28e\` FOREIGN KEY (\`movieId\`) REFERENCES \`movie\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ticket\` ADD CONSTRAINT \`FK_0e01a7c92f008418bad6bad5919\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ticket_shows_show\` ADD CONSTRAINT \`FK_6e7c5cf7e6b6b04ce13f606a9dc\` FOREIGN KEY (\`ticketId\`) REFERENCES \`ticket\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`ticket_shows_show\` ADD CONSTRAINT \`FK_513d24b8fe0a3576464cb2b7c54\` FOREIGN KEY (\`showId\`) REFERENCES \`show\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`ticket_shows_show\` DROP FOREIGN KEY \`FK_513d24b8fe0a3576464cb2b7c54\``);
        await queryRunner.query(`ALTER TABLE \`ticket_shows_show\` DROP FOREIGN KEY \`FK_6e7c5cf7e6b6b04ce13f606a9dc\``);
        await queryRunner.query(`ALTER TABLE \`ticket\` DROP FOREIGN KEY \`FK_0e01a7c92f008418bad6bad5919\``);
        await queryRunner.query(`ALTER TABLE \`show\` DROP FOREIGN KEY \`FK_9f463fbeea3edaba1061f97e28e\``);
        await queryRunner.query(`ALTER TABLE \`show\` DROP FOREIGN KEY \`FK_d0de168ac3191ccda28b7224c7d\``);
        await queryRunner.query(`ALTER TABLE \`image\` DROP FOREIGN KEY \`FK_f9ca629edc61a86c266d14eb8df\``);
        await queryRunner.query(`ALTER TABLE \`transaction\` DROP FOREIGN KEY \`FK_605baeb040ff0fae995404cea37\``);
        await queryRunner.query(`DROP INDEX \`IDX_513d24b8fe0a3576464cb2b7c5\` ON \`ticket_shows_show\``);
        await queryRunner.query(`DROP INDEX \`IDX_6e7c5cf7e6b6b04ce13f606a9d\` ON \`ticket_shows_show\``);
        await queryRunner.query(`DROP TABLE \`ticket_shows_show\``);
        await queryRunner.query(`DROP INDEX \`IDX_a62473490b3e4578fd683235c5\` ON \`user\``);
        await queryRunner.query(`DROP TABLE \`user\``);
        await queryRunner.query(`DROP TABLE \`ticket\``);
        await queryRunner.query(`DROP TABLE \`show\``);
        await queryRunner.query(`DROP TABLE \`movie\``);
        await queryRunner.query(`DROP INDEX \`REL_f9ca629edc61a86c266d14eb8d\` ON \`image\``);
        await queryRunner.query(`DROP INDEX \`IDX_e4dfc6a6f95452c9c931f5df48\` ON \`image\``);
        await queryRunner.query(`DROP TABLE \`image\``);
        await queryRunner.query(`DROP INDEX \`IDX_535c742a3606d2e3122f441b26\` ON \`room\``);
        await queryRunner.query(`DROP TABLE \`room\``);
        await queryRunner.query(`DROP TABLE \`transaction\``);
    }

}
