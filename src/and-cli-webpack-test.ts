#!/usr/bin/env node

import { OptionStringBuilder } from "./utilities/option-string-builder";
import { CommandStringBuilder } from "./utilities/command-string-builder";
import { CommandRunner } from "./modules/command-runner";
import child_process from "child_process";
import { Dir } from "./modules/dir";
import { Echo } from "./modules/echo";
import { FrontendPath } from "./modules/frontend-path";
import { NodeClean } from "./modules/node-clean";
import { NodeRestore } from "./modules/node-restore";
import program from "commander";
import shell from "shelljs";
import { Process } from "./modules/process";

CommandRunner.run(async () => {
    // -----------------------------------------------------------------------------------------
    // #region Constants
    // -----------------------------------------------------------------------------------------

    const CI_OPTION_STRING = new OptionStringBuilder("ci");

    const WEBPACK_TEST_OPTIONS = {
        CI: CI_OPTION_STRING,
    };

    // #endregion Constants

    // -----------------------------------------------------------------------------------------
    // #region Functions
    // -----------------------------------------------------------------------------------------

    /**
     * Developer note: This should be abstracted into a module and tested
     * @see https://github.com/AndcultureCode/AndcultureCode.Cli/issues/96
     */
    const webpackTest = {
        cmd(isCI: boolean = false): string {
            if (isCI) {
                return "npx cross-env CI=true npm run test";
            }

            return "npm run test";
        },
        description() {
            return `Runs the webpack project tests in ${FrontendPath.projectDir()} (via ${this.cmd()})`;
        },
        getOptions() {
            return WEBPACK_TEST_OPTIONS;
        },
        run() {
            Dir.pushd(FrontendPath.projectDir());

            if (program.clean) {
                NodeClean.run();
            }

            if (program.restore) {
                NodeRestore.run();
            }

            Echo.message(
                `Running frontend tests (via ${this.cmd(program.ci)})...`
            );

            Process.spawn(this.cmd(program.ci));

            Dir.popd();
            Echo.newLine();
            Echo.message("Exited webpack-test");
        },
    };

    // #endregion Functions

    // -----------------------------------------------------------------------------------------
    // #region Entrypoint
    // -----------------------------------------------------------------------------------------

    program
        .usage("option(s)")
        .description(
            webpackTest.description() +
                "\r\nCertain options can be chained together for specific behavior" +
                " (--clean and --restore can be used in conjunction)."
        )
        .option(
            WEBPACK_TEST_OPTIONS.CI.toString(),
            "Run the command for continuous integration instead of as a daemon"
        )
        .option(NodeClean.getOptions().toString(), NodeClean.description())
        .option(NodeRestore.getOptions().toString(), NodeRestore.description())
        .parse(process.argv);

    webpackTest.run();

    // #endregion Entrypoint
});
