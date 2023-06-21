import { create } from "zustand";
import { createDbSession } from "../storage/SqlStorageMiddlewares";
import { SqlDbSessionStoreType } from "../Types";

export const useSqlDbSessionStore = create<SqlDbSessionStoreType>((set) => ({
  sqlDbSession: undefined,
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
  setSqlDbSession: async (name?) => {
    set({
      sqlDbSession: await createDbSession(name),
    });
  },
}));
