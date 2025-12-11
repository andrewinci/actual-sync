import * as api from "@actual-app/api";
import { mkdir } from "fs/promises";

export type ActualConfig = {
  syncId: string;
  password: string;
  url: string;
  cacheDir: string;
};

export type ActualTransaction = {
  /** Required. The ID of the account this transaction belongs to */
  account: string;
  /** Required. Transaction date in YYYY-MM-DD format */
  date: string;
  /** A currency amount as an integer representing the value without decimal places.
   * For example, USD amount of $120.30 would be 12030 */
  amount: number;
  /** If given, a payee will be created with this name.
   * If this matches an already existing payee, that payee will be used.
   * Only available in create/import requests */
  payee_name: string;
  /** Any additional notes for the transaction */
  notes: string;
  /** A unique id usually given by the bank, if importing.
   * Use this to avoid duplicate transactions */
  imported_id: string;
  /** A flag indicating if the transaction has cleared or not */
  cleared?: boolean;
};

export const Actual = (config: ActualConfig) => {
  const setup = async () => {
    await mkdir(config.cacheDir, { recursive: true });
    await api.init({
      dataDir: config.cacheDir,
      serverURL: config.url,
      password: config.password,
      verbose: false,
    });
    await api.downloadBudget(config.syncId);
  };

  const listAccounts = async () => {
    try {
      await setup();
      const accounts = await api.getAccounts();
      return accounts.map((a) => ({ name: a.name, id: a.id }));
    } finally {
      await api.shutdown();
    }
  };

  const loadTransactions = async (
    accountId: string,
    txs: ActualTransaction[],
  ) => {
    try {
      await setup();
      const res = await api.importTransactions(accountId, txs);
      return {
        errors: (res.errors as []).length,
        added: (res.added as []).length,
        updated: (res.updated as []).length,
        updatedPreview: (res.updatedPreview as []).length,
      }
    } finally {
      await api.shutdown();
    }
  };
  return { listAccounts, loadTransactions };
};
