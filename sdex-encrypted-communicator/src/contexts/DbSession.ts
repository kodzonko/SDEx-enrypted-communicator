import { create } from "zustand";
import { createDbSession } from "../storage/SqlStorageMiddlewares";
import { SqlDbSessionStoreType } from "../Types";

export const useSqlDbSessionStore = create<SqlDbSessionStoreType>((set) => ({
    sqlDbSession: undefined,
    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    setSqlDbSession: async (fileName?) => {
        set({
            sqlDbSession: await createDbSession(fileName),
        });
    },
}));
