import chalk from "chalk";
import { Actual, ActualTransaction } from "./actual";
import { AppConfig } from "./config";
import { Truelayer, TruelayerTransaction } from "./truelayer";
import { Trading212 } from "./trading212";
import * as YAML from "yaml";
import { Ntfy } from "./ntfy";

export type SyncConfig = {
  map: {
    name: string;
    truelayerAccountId?: string;
    trading212AccountId?: string;
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
      cleared: false,
    };
  };

  const sync = async () => {
    const actual = Actual(config.actual);
    const truelayer = Truelayer(config.truelayer);
    const trading212 = config.trading212 ? Trading212(config.trading212) : null;
    const actualAccounts = await actual.listAccounts();
    const truelayerAccounts = truelayer.listAccounts();
    const trading212Accounts = trading212?.listAccounts() ?? [];
    let syncResult = {
      accountSyncs: 0,
      newTransactions: 0,
      balanceMismatches: 0,
    };
    for (var syncConfig of config.sync.map) {
      console.log(
        chalk.bold.bgYellow(`\nSync transactions for ${syncConfig.name}`),
      );
      const actualAccount = actualAccounts.find(
        (a) => a.id === syncConfig.actualAccountId,
      );
      if (!actualAccount)
        throw new Error(
          `Actual account id ${syncConfig.actualAccountId} not found. Check your sync config`,
        );

      // Handle TrueLayer accounts
      if (syncConfig.truelayerAccountId) {
        const truelayerAccount = truelayerAccounts.find(
          (a) => a.id === syncConfig.truelayerAccountId,
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
        const report = await actual.loadTransactions(
          syncConfig.actualAccountId,
          actualTransactions,
        );
        console.log(chalk.green("Sync result"));
        console.log(YAML.stringify(report, null, 2));
        // verify balances
        const truelayerBalance = await truelayer.getBalance(truelayerAccount);
        const actualBalance = await actual.getBalance(actualAccount.id);
        const sign = truelayerAccount.type === "CARD" ? -1 : 1;
        syncResult.newTransactions += report.added;
        if (truelayerBalance?.current === (actualBalance / 100) * sign)
          console.log(chalk.green(`Account balances match`));
        else {
          syncResult.balanceMismatches += 1;
          console.log(chalk.red(`Account balances DO NOT match`));
          console.log(chalk.green("\nOnline balance"));
          console.log(YAML.stringify(truelayerBalance, null, 2));
          console.log(chalk.green("\nActual balance"));
          console.log(actualBalance / 100);
        }
        syncResult.accountSyncs += 1;
      }
      // Handle Trading212 accounts
      else if (syncConfig.trading212AccountId) {
        if (!trading212)
          throw new Error(
            "Trading212 is not configured but account sync requested",
          );
        const trading212Account = trading212Accounts.find(
          (a) => a.id === syncConfig.trading212AccountId,
        );
        if (!trading212Account)
          throw new Error(
            `Trading212 account id ${syncConfig.trading212AccountId} not found. Check your sync config`,
          );

        // Get current balance from Trading212
        const trading212Balance =
          await trading212.getBalance(trading212Account);
        const actualBalance = await actual.getBalance(actualAccount.id);

        // Calculate the difference and create a reconciliation transaction
        const difference = trading212Balance.total * 100 - actualBalance;

        if (Math.abs(difference) > 1) {
          // Only create transaction if difference > 0.01
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, "0");
          const dd = String(today.getDate()).padStart(2, "0");

          const reconciliationTx: ActualTransaction = {
            account: syncConfig.actualAccountId,
            date: `${yyyy}-${mm}-${dd}`,
            amount: difference,
            notes: `Balance reconciliation - Trading212 account value adjustment`,
            imported_id: `t212-reconcile-${yyyy}${mm}${dd}`,
            payee_name: "Trading212 Balance Adjustment",
            cleared: true,
          };

          const report = await actual.loadTransactions(
            syncConfig.actualAccountId,
            [reconciliationTx],
          );
          console.log(chalk.green("Reconciliation result"));
          console.log(YAML.stringify(report, null, 2));
          syncResult.newTransactions += report.added;
        }

        // Verify balances after reconciliation
        const updatedActualBalance = await actual.getBalance(actualAccount.id);
        if (Math.abs(trading212Balance.total * 100 - updatedActualBalance) < 2)
          console.log(chalk.green(`Account balances match`));
        else {
          syncResult.balanceMismatches += 1;
          console.log(chalk.red(`Account balances DO NOT match`));
          console.log(chalk.green("\nTrading212 balance"));
          console.log(YAML.stringify(trading212Balance, null, 2));
          console.log(chalk.green("\nActual balance"));
          console.log(updatedActualBalance / 100);
        }
        syncResult.accountSyncs += 1;
      } else {
        throw new Error(
          `Sync config for ${syncConfig.name} must have either truelayerAccountId or trading212AccountId`,
        );
      }
    }
    if (config.ntfy) {
      const hasIssues = syncResult.balanceMismatches > 0;
      const title = hasIssues
        ? "Actual sync requires attention"
        : "Actual sync import completed";
      const tags = hasIssues ? ["warning"] : ["white_check_mark"];
      await Ntfy(config.ntfy).post({
        title,
        body: `Number of accounts synced: ${syncResult.accountSyncs}
Number of transactions added: ${syncResult.newTransactions}
Number of balance mismatches: ${syncResult.balanceMismatches}`,
        tags,
      });
    }
  };

  return { sync };
};
