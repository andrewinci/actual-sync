import chalk from "chalk";
import { Actual, ActualTransaction } from "./actual";
import { AppConfig } from "./config";
import { Truelayer, TruelayerTransaction } from "./truelayer";

export type SyncConfig = {
  map: {
    name: string,
    truelayerAccountId: string;
    actualAccountId: string;
    mapConfig: { invertAmount?: boolean };
  }[];
};

export const Sync = (config: AppConfig) => {
  const mapTx = (
    tx: TruelayerTransaction,
    accountId: string,
    mapConfig: { invertAmount?: boolean },

  ): ActualTransaction => {
    const date = new Date(tx.timestamp);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    return {
      account: accountId,
      date: `${yyyy}-${mm}-${dd}`,
      amount: (mapConfig.invertAmount ? -1 : +1) * Math.round(tx.amount * 100),
      notes: tx.description,
      imported_id: tx.transaction_id,
      payee_name: tx.meta.provider_merchant_name,
      cleared: false
    };
  };

  const sync = async () => {
    const actual = Actual(config.actual);
    const truelayer = Truelayer(config.truelayer);
    const actualAccounts = await actual.listAccounts();
    const truelayerAccounts = truelayer.listAccounts();
    for (var syncConfig of config.sync.map) {
      console.log(chalk.bold.bgYellow(`\nSync transactions for ${syncConfig.name}`));
      const actualAccount = actualAccounts.find((a) => a.id === syncConfig.actualAccountId);
      const truelayerAccount = truelayerAccounts.find((a) => a.id === syncConfig.truelayerAccountId);
      if (!actualAccount)
        throw new Error(
          `Actual account id ${syncConfig.actualAccountId} not found. Check your sync config`,
        );
      if (!truelayerAccount)
        throw new Error(
          `Truelayer account id ${syncConfig.truelayerAccountId} not found. Check your sync config`,
        );
      const truelayerTransactions =
        await truelayer.getTransactions(truelayerAccount);
      const actualTransactions = truelayerTransactions.map((t) =>
        mapTx(t, syncConfig.actualAccountId, syncConfig.mapConfig),
      );
      const report = await actual.loadTransactions(syncConfig.actualAccountId, actualTransactions);
      console.log(chalk.green(JSON.stringify(report, null, 2)));
    }
  };

  return { sync };
};
