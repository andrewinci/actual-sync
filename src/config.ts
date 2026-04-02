import { readFile, writeFile } from "fs/promises";
import { parse, stringify } from "yaml";
import { TruelayerConfig } from "./truelayer";
import { ActualConfig } from "./actual";
import { SyncConfig } from "./sync";
import { NtfyConfig } from "./ntfy";

export type AppConfig = {
  actual: ActualConfig;
  truelayer: TruelayerConfig;
  sync: SyncConfig;
  ntfy: NtfyConfig | null;
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
  ntfy: null,
};

const CONFIG_FILE_NAME = process.env.CONFIG_FILE_PATH ?? ".config.yml";

export const loadConfig = async (): Promise<AppConfig> => {
  const config: AppConfig = await readFile(CONFIG_FILE_NAME)
    .then((d) => {
      try {
        return parse(d.toString());
      } catch (err) {
        console.error(
          `Error: Failed to parse config file "${CONFIG_FILE_NAME}": ${err instanceof Error ? err.message : err}`,
        );
        console.error(
          'Run "actual-sync config create" to generate a default config file.',
        );
        process.exit(1);
      }
    })
    .catch((err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") {
        console.error(`Error: Config file "${CONFIG_FILE_NAME}" not found.`);
        console.error(
          'Run "actual-sync config create" to generate a default config file.',
        );
      } else {
        console.error(
          `Error: Could not read config file "${CONFIG_FILE_NAME}": ${err.message}`,
        );
      }
      process.exit(1);
    });
  // merge with default
  return {
    actual: { ...DEFAULT_CONFIG.actual, ...config?.actual },
    truelayer: { ...DEFAULT_CONFIG.truelayer, ...config?.truelayer },
    sync: { ...DEFAULT_CONFIG.sync, ...config?.sync },
    ntfy: config?.ntfy,
  };
};
export const createConfig = async () =>
  writeFile(CONFIG_FILE_NAME, stringify(DEFAULT_CONFIG)).catch((err) =>
    console.error(err),
  );
