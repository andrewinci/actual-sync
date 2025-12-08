#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";

program.version("1.0.0").description("Truelayer to actual sync");

program.action(() => {
    inquirer
        .prompt([
            {
                type: "input",
                name: "name",
                message: "What's your name?",
            },
        ])
        .then((answers) => {
            console.log(chalk.green(`Hey there, ${answers.name}!`));
        });
});

program.parse(process.argv);