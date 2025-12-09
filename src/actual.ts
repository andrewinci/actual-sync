import { ActualConfig } from "./config";
import * as api from "@actual-app/api";
import { mkdir } from "fs/promises";

export const Actual = (config: ActualConfig) => {
    const setup = async () => {
        await mkdir(config.cacheDir, { recursive: true });
        await api.init({ dataDir: config.cacheDir, serverURL: config.url, password: config.password, verbose: false });
        await api.downloadBudget(config.syncId);
    }

    const listAccounts = async () => {
        try {
            await setup();
            const accounts = await api.getAccounts();
            return accounts.map(a => ({ name: a.name, id: a.id }))
        } finally {
            await api.shutdown();
        }
    }

    return { listAccounts }
}