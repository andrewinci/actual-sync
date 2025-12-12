#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import * as YAML from "yaml";
import { loadConfig, createConfig } from "./config";
import { Actual } from "./actual";
import { Truelayer } from "./truelayer";
import { Sync } from "./sync";

program.version("1.0.0").description("Actual sync");

// Config
program
  .command("config")
  .command("create")
  .action(() => {
    inquirer
      .prompt({
        type: "confirm",
        name: "confirm",
        message:
          "Create default config file? (if a file exists it will be overwritten)",
      })
      .then(({ confirm }) => {
        if (confirm) createConfig();
      });
  });
// Actual
const actualCommand = program.command("actual");
actualCommand.command("list-accounts").action(async () => {
  const config = await loadConfig();
  const actual = Actual(config.actual);
  const accounts = await actual.listAccounts();
  console.log(YAML.stringify(accounts, null, 2));
});

// Truelayer
const truelayerCommand = program.command("truelayer");
truelayerCommand.command("add-account").action(async () => {
  const config = await loadConfig();
  const truelayer = Truelayer(config.truelayer);
  const accounts = await truelayer.addAccounts();
  console.log(
    chalk.green("Update your truelayer config with the following accounts"),
  );
  console.log(YAML.stringify(accounts));
});
truelayerCommand.command("list-accounts").action(async () => {
  const config = await loadConfig();
  const truelayer = Truelayer(config.truelayer);
  console.log(YAML.stringify(truelayer.listAccounts(), null, 2));
});
truelayerCommand
  .command("list-transactions")
  .argument("accountId")
  .action(async (accountId) => {
    const config = await loadConfig();
    const account = config.truelayer.accounts.find((a) => a.id === accountId);
    if (account) {
      const truelayer = Truelayer(config.truelayer);
      const transactions = await truelayer.getTransactions(account);
      console.log(YAML.stringify(transactions, null, 2));
    } else {
      console.log(
        chalk.red(
          "The account doesn't exists. Check the id and make sure the account is added first",
        ),
      );
    }
  });

truelayerCommand
  .command("get-balance")
  .argument("accountId")
  .action(async (accountId) => {
    const config = await loadConfig();
    const account = config.truelayer.accounts.find((a) => a.id === accountId);
    if (account) {
      const truelayer = Truelayer(config.truelayer);
      const balance = await truelayer.getBalance(account);
      console.log(JSON.stringify(balance, null, 2));
    } else {
      console.log(
        chalk.red(
          "The account doesn't exists. Check the id and make sure the account is added first",
        ),
      );
    }
  });

program.command("sync").action(async () => {
  const config = await loadConfig();
  await Sync(config).sync();
});
program.parse(process.argv);
