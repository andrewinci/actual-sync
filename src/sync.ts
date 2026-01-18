import chalk from "chalk";
import { Actual, ActualTransaction } from "./actual";
import { AppConfig } from "./config";
import { Truelayer, TruelayerTransaction } from "./truelayer";
import * as YAML from "yaml";
import { Ntfy } from "./ntfy";

export type SyncConfig = {
  map: {
    name: string;
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
      payee_name: tx.meta.provider_merchant_name ?? tx.meta.counter_party_preferred_name ?? tx.description,
      cleared: false,
    };
  };

  const sync = async () => {
    const actual = Actual(config.actual);
    const truelayer = Truelayer(config.truelayer);
    const actualAccounts = await actual.listAccounts();
    const truelayerAccounts = truelayer.listAccounts();
    let syncResult = {
      accountSyncs: 0,
      newTransactions: 0,
      balanceMismatches: 0,
      mismatchedBanks: [] as string[],
    };
    for (var syncConfig of config.sync.map) {
      console.log(
        chalk.bold.bgYellow(`\nSync transactions for ${syncConfig.name}`),
      );
      const actualAccount = actualAccounts.find(
        (a) => a.id === syncConfig.actualAccountId,
      );
      const truelayerAccount = truelayerAccounts.find(
        (a) => a.id === syncConfig.truelayerAccountId,
      );
      if (!actualAccount)
        throw new Error(
          `Actual account id ${syncConfig.actualAccountId} not found for bank "${syncConfig.name}". Check your sync config`,
        );
      if (!truelayerAccount)
        throw new Error(
          `Truelayer account id ${syncConfig.truelayerAccountId} not found for bank "${syncConfig.name}". Check your sync config`,
        );
      const truelayerTransactions = await truelayer.getTransactions(truelayerAccount)
        .catch(error => {
          throw new Error(`Failed to get transactions for bank "${syncConfig.name}": ${error.message || error}`);
        });
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
      const truelayerBalance = await truelayer.getBalance(truelayerAccount)
        .catch(error => {
          throw new Error(`Failed to get balance for bank "${syncConfig.name}": ${error.message || error}`);
        });
      const actualBalance = await actual.getBalance(actualAccount.id);
      const sign = truelayerAccount.type === "CARD" ? -1 : 1;
      syncResult.newTransactions += report.added;
      if (truelayerBalance?.current === (actualBalance / 100) * sign)
        console.log(chalk.green(`Account balances match`));
      else {
        syncResult.balanceMismatches += 1;
        syncResult.mismatchedBanks.push(syncConfig.name);
        console.log(chalk.red(`Account balances DO NOT match`));
        console.log(chalk.green("\nOnline balance"));
        console.log(YAML.stringify(truelayerBalance, null, 2));
        console.log(chalk.green("\nActual balance"));
        console.log(actualBalance / 100);
      }
      syncResult.accountSyncs += 1;
    }
    if (config.ntfy) {
      console.log(chalk.blue('\n📱 Sending notification...'));
      const hasIssues = syncResult.balanceMismatches > 0;
      const title = hasIssues
        ? "Actual Sync - Issues Detected"
        : "Actual Sync Completed";
      const tags = hasIssues ? ["warning", "bank"] : ["white_check_mark", "bank"];
      
      const body = [
        `Sync Summary`,
        `- Accounts synced: ${syncResult.accountSyncs}`,
        `- New transactions: ${syncResult.newTransactions}`,
        `- Balance mismatches: ${syncResult.balanceMismatches}`,
        '',
        hasIssues 
          ? `Balance mismatches detected in: ${syncResult.mismatchedBanks.join(', ')}` 
          : 'All accounts synced successfully with matching balances!'
      ].join('\n');
      
      try {
        await Ntfy(config.ntfy).post({
          title,
          body,
          tags,
          priority: hasIssues ? 'high' : 'default'
        });
      } catch (error) {
        console.error(chalk.red('Failed to send notification:'), error);
      }
    }
  };

  return { sync };
};
