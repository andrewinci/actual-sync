import { Actual, ActualTransaction } from "./actual";
import { AppConfig } from "./config";
import { Truelayer, TruelayerTransaction } from "./truelayer";

export type SyncConfig = {
  map: { truelayerAccountId: string; actualAccountId: string }[];
};

export const Sync = (config: AppConfig) => {
  const mapTx = (tx: TruelayerTransaction): ActualTransaction => {
    const date = new Date(tx.timestamp);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    return {
      date: `${yyyy}-${mm}-${dd}`,
      amount: Math.round(tx.amount * 100),
      notes: tx.description,
      imported_id: tx.transaction_id,
      payee_name: tx.meta.provider_merchant_name,
    };
  };

  const sync = async () => {
    const actual = Actual(config.actual);
    const truelayer = Truelayer(config.truelayer);
    const actualAccounts = await actual.listAccounts();
    const truelayerAccounts = await truelayer.listAccounts();

    const syncs = config.sync.map.map(
      async ({ actualAccountId, truelayerAccountId }) => {
        const actualAccount = actualAccounts.find(
          (a) => a.id === actualAccountId,
        );
        const truelayerAccount = truelayerAccounts.find(
          (a) => a.id === truelayerAccountId,
        );
        if (!actualAccount)
          throw new Error(
            `Actual account id ${actualAccountId} not found. Check your sync config`,
          );
        if (!truelayerAccount)
          throw new Error(
            `Truelayer account id ${truelayerAccountId} not found. Check your sync config`,
          );
        const truelayerTransactions =
          await truelayer.getTransactions(truelayerAccount);
        const actualTransactions = truelayerTransactions.map(mapTx);
        await actual.loadTransactions(actualAccountId, actualTransactions);
      },
    );

    return Promise.all(syncs);
  };

  return { sync };
};
