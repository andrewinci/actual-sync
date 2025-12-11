import { readFile, writeFile } from "fs/promises"
import { parse, stringify } from "yaml"
import { TruelayerConfig } from "./truelayer"
import { ActualConfig } from "./actual"

export type AppConfig = {
    actual: ActualConfig,
    truelayer: TruelayerConfig
}
const DEFAULT_CONFIG: AppConfig = {
    actual: {
        password: "",
        syncId: "",
        url: "localhost",
        cacheDir: ".cache/actual/"
    },
    truelayer: {
        redirectUri: "https://console.truelayer.com/redirect-page",
        cacheDir: ".cache/truelayer/",
        clientId: "",
        clientSecret: "",
        accounts: [],
    }
};

const CONFIG_FILE_NAME = ".config.yml"
export const loadConfig = async (): Promise<AppConfig> => {
    const config: AppConfig = await readFile(CONFIG_FILE_NAME).then(d => parse(d.toString())).catch(() => DEFAULT_CONFIG);
    // merge with default
    return ({
        actual: { ...DEFAULT_CONFIG.actual, ...config?.actual },
        truelayer: { ...DEFAULT_CONFIG.truelayer, ...config?.truelayer },
    })
}

export const writeConfig = async (config: AppConfig) => {
    return writeFile(CONFIG_FILE_NAME, stringify(config)).catch(err => console.error(err));
}