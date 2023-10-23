import * as FileSystem from "expo-file-system";
import { logger as _logger } from "react-native-logs";

const config = {
    levels: {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
    },
    transportOptions: {
        FS: FileSystem,
        fileName: "sdex-communicator-logs.txt",
    },
};

const logger = _logger.createLogger<"debug" | "info" | "warn" | "error">(config);
export default logger;
