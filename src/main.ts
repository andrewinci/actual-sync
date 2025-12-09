#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { loadConfig, writeConfig } from "./config"
import { Actual } from "./actual";

program.version("1.0.0").description("TA sync - Truelayer to Actual sync");

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
        console.log(chalk.green("Actual configurations updated"));
    })
});
actualCommand.command("list-accounts").action(async () => {
    const config = await loadConfig()
    const actual = Actual(config.actual);
    const accounts = await actual.listAccounts()
    console.log(JSON.stringify(accounts, null, 2));
})

program.parse(process.argv);