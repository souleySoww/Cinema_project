// src/config/logger.d.ts
declare module './logger' {
    export interface Logger {
        info(message: string): void;
        warn(message: string): void;
        error(message: string): void;
    }

    const logger: Logger;
    export default logger;
}
