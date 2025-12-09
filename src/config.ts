import { readFile, writeFile } from "fs/promises"
import { parse, stringify } from "yaml"

export type AppConfig = {
    actual: ActualConfig
}

export type ActualConfig = {
    syncId: string,
    password: string,
    url: string
}

const DEFAULT_CONFIG: AppConfig = {
    actual: {
        password: "",
        syncId: "",
        url: "localhost"
    }
};

const CONFIG_FILE_NAME = ".config.yml"
export const loadConfig = async (): Promise<AppConfig> => {
    return readFile(CONFIG_FILE_NAME).then(d => parse(d.toString())).catch(() => DEFAULT_CONFIG);
}

export const writeConfig = async (config: AppConfig) => {
    return writeFile(CONFIG_FILE_NAME, stringify(config)).catch(err => console.error(err));
}