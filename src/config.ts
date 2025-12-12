import { readFile, writeFile } from "fs/promises";
import { parse, stringify } from "yaml";
import { TruelayerConfig } from "./truelayer";
import { ActualConfig } from "./actual";
import { SyncConfig } from "./sync";

export type AppConfig = {
  actual: ActualConfig;
  truelayer: TruelayerConfig;
  sync: SyncConfig;
};
const DEFAULT_CONFIG: AppConfig = {
  actual: {
    password: "<actual password>",
    syncId: "<sync id from https://..../settings >",
    url: "localhost",
    cacheDir: ".cache/",
  },
  truelayer: {
    redirectUri: "https://console.truelayer.com/redirect-page",
    clientId: "<truelayer app clientID>",
    clientSecret: "<truelayer app secretId>",
    accounts: [],
  },
  sync: {
    map: [],
  },
};

const CONFIG_FILE_NAME = process.env.CONFIG_FILE_PATH ?? ".config.yml";

export const loadConfig = async (): Promise<AppConfig> => {
  const config: AppConfig = await readFile(CONFIG_FILE_NAME)
    .then((d) => parse(d.toString()))
    .catch(() => DEFAULT_CONFIG);
  // merge with default
  return {
    actual: { ...DEFAULT_CONFIG.actual, ...config?.actual },
    truelayer: { ...DEFAULT_CONFIG.truelayer, ...config?.truelayer },
    sync: { ...DEFAULT_CONFIG.sync, ...config?.sync },
  };
};
export const createConfig = async () =>
  writeFile(CONFIG_FILE_NAME, stringify(DEFAULT_CONFIG)).catch((err) =>
    console.error(err),
  );
