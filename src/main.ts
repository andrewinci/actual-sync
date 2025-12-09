#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { loadConfig, writeConfig } from "./config"

program.version("1.0.0").description("Truelayer to Actual sync");

program.command("actual").command("config").action(async () => {
    const config = await loadConfig();
    const actualConfig = config.actual;
    inquirer.prompt([
        { type: "input", name: "url", default: actualConfig.url, message: "Actual server url" },
        { type: "input", name: "password", default: actualConfig.password, message: "Actual server password" },
        { type: "input", name: "syncId", default: actualConfig.syncId, message: "Actual syncId" },
    ]).then(async (answers) => {
        await writeConfig({ ...config, actual: answers })
        console.log(chalk.green("Actual configurations updated"));
    })
});

program.parse(process.argv);