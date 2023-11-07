import { consoleTransport, logger as _logger } from "react-native-logs";

const config = {
    severity: "debug",
    levels: {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
    },
    transport: consoleTransport,
    transportOptions: {
        colors: {
            debug: "grey",
            info: "blueBright",
            warn: "yellowBright",
            error: "redBright",
        },
    },
    dateFormat: "time",
    printLevel: true,
    printDate: true,
    enabled: true,
};

const logger = _logger.createLogger<"debug" | "info" | "warn" | "error">(config);

export default logger;
