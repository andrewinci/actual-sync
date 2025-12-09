#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { loadConfig, writeConfig } from "./config"
import { Actual } from "./actual";
import { Truelayer } from "./truelayer";

program.version("1.0.0").description("TA sync - Truelayer to Actual sync");

// Actual
const actualCommand = program.command("actual")
actualCommand.command("config").action(async () => {
    const config = await loadConfig();
    const actualConfig = config.actual;
    inquirer.prompt([
        { type: "input", name: "url", default: actualConfig.url, message: "Actual server url" },
        { type: "input", name: "password", default: actualConfig.password, message: "Actual server password" },
        { type: "input", name: "syncId", default: actualConfig.syncId, message: "Actual syncId" },
        { type: "input", name: "cacheDir", default: actualConfig.cacheDir, message: "Local dir for cache" },
    ]).then(async (answers) => {
        await writeConfig({ ...config, actual: answers })
        console.log(chalk.green("Actual configuration updated"));
    })
});
actualCommand.command("list-accounts").action(async () => {
    const config = await loadConfig()
    const actual = Actual(config.actual);
    const accounts = await actual.listAccounts()
    console.log(JSON.stringify(accounts, null, 2));
})

// True layer
const truelayerCommand = program.command("truelayer");
truelayerCommand.command("config").action(async () => {
    const config = await loadConfig();
    const actualConfig = config.truelayer;
    inquirer.prompt([
        { type: "input", name: "clientId", default: actualConfig.clientId, message: "Truelayer app clientID" },
        { type: "input", name: "clientSecret", default: actualConfig.clientSecret, message: "Truelayer app clientSecret" },
        { type: "input", name: "redirectUri", default: actualConfig.redirectUri, message: "Truelayer app redirect uri" },
        { type: "input", name: "cacheDir", default: actualConfig.cacheDir, message: "Local dir for cache" },
    ]).then(async (answers) => {
        await writeConfig({ ...config, truelayer: answers })
        console.log(chalk.green("Truelayer configuration updated"));
    })
});
truelayerCommand.command("add-account").action(async () => {
    const config = await loadConfig()
    const truelayer = Truelayer(config.truelayer);
    await truelayer.auth();
    console.log(chalk.green("Account added and auth setup"));
});

program.parse(process.argv);