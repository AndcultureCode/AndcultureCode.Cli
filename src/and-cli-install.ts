#!/usr/bin/env node

import { Constants } from "./modules/constants";
import { StringUtils } from "andculturecode-javascript-core";
import { CommandDefinitions } from "./modules/command-definitions";
import { Echo } from "./modules/echo";
import { File } from "./modules/file";
import { Formatters } from "./modules/formatters";
import { Js } from "./modules/js";
import { PackageConfig } from "./modules/package-config";
import program from "commander";
import shell from "shelljs";
import upath from "upath";
import { CommandRunner } from "./modules/command-runner";
import { Process } from "./modules/process";
import { ProcessResult } from "./interfaces/process-result";

CommandRunner.run(async () => {
    // -----------------------------------------------------------------------------------------
    // #region Constants
    // -----------------------------------------------------------------------------------------

    const { CLI_NAME, ENTRYPOINT } = Constants;

    // #endregion Constants

    // -----------------------------------------------------------------------------------------
    // #region Public Functions
    // -----------------------------------------------------------------------------------------

    const install = {
        cmd(packageName: string) {
            return `npm install --global ${packageName}`;
        },
        description() {
            return "Configures development machine with global npm, project-specific and developer and-cli tools";
        },
        run() {
            // Local project (likely a plugin CLI) global install
            const binName = PackageConfig.getLocalBinName();
            if (StringUtils.hasValue(binName) && binName !== CLI_NAME) {
                _installLocalProjectGlobally(binName!);
            }

            // Global npm package
            _installAndCliGlobally();

            // Project-specific alias
            _installNpxAlias();

            // Developer alias
            _installDevAlias();

            // Reload shell
            Echo.newLine();
            Echo.success(
                "Install successful. Reload your shell for changes to take effect"
            );
        },
    };

    // #endregion Public Functions

    // -----------------------------------------------------------------------------------------
    // #region Private Functions
    // -----------------------------------------------------------------------------------------

    const _bashFileContains = (text: string): boolean =>
        StringUtils.hasValue(shell.cat(File.bashFile()).grep(text).stdout);

    const _installAndCliGlobally = (): void => {
        const cmd = install.cmd(CLI_NAME);
        Echo.message(
            `Installing ${CLI_NAME} as global npm tool... (via ${cmd})`
        );

        if (!_spawnAndHandleErrors(cmd)) {
            return;
        }

        Echo.success(`Successfully installed ${CLI_NAME} globally`);
        Echo.newLine();
    };

    const _installDevAlias = (): void => {
        const andCliDev = `${CLI_NAME}-dev`;
        Echo.message(
            `Configuring cli development '${andCliDev}' bash alias...`
        );
        const pathToCli = upath.join(
            shell.pwd().toString(),
            Constants.DIST,
            ENTRYPOINT
        );
        const developerAlias = `alias ${andCliDev}='${pathToCli}'`;

        if (_bashFileContains(developerAlias)) {
            Echo.success(`${andCliDev} bash alias already installed`);
            Echo.newLine();
            return;
        }

        _writeToBashFile("");
        _writeToBashFile(
            `# ${CLI_NAME} global development alias pointing to your fork of the repository`
        );
        _writeToBashFile(developerAlias);

        Echo.success(`Successfully installed ${andCliDev} alias`);
    };

    const _installLocalProjectGlobally = (binName: string): void => {
        const cmd = install.cmd(".");
        Echo.message(
            `Installing current project as a global npm tool... (via ${cmd})`
        );

        if (!_spawnAndHandleErrors(cmd)) {
            return;
        }

        Echo.success("Current project was successfully installed globally");
        Echo.message(
            `You should now be able to run it from any directory with: ${Formatters.purple(
                `${binName} <command>`
            )}`
        );
        Echo.newLine();
    };

    const _installNpxAlias = (): void => {
        Echo.message(
            `Configuring project-specific '${CLI_NAME}' bash alias...`
        );
        const projectAlias = `alias ${CLI_NAME}='npx ${CLI_NAME}'`;

        if (_bashFileContains(projectAlias)) {
            Echo.success(`${CLI_NAME} bash alias already installed`);
            Echo.newLine();
            return;
        }

        _writeToBashFile("");
        _writeToBashFile(`# ${CLI_NAME} project-level alias`);
        _writeToBashFile(projectAlias);

        Echo.success(`Successfully installed ${CLI_NAME} bash alias`);
        Echo.newLine();
    };

    const _spawnAndHandleErrors = (cmd: string): boolean | never => {
        Process.spawn(cmd, {
            onError: (result: ProcessResult) =>
                `There was an error installing the package: ${result.code}`,
        });

        return true;
    };

    const _writeToBashFile = (text: string) =>
        shell.echo(text).toEnd(File.bashFile());

    // #endregion Private Functions

    // -----------------------------------------------------------------------------------------
    // #region Entrypoint
    // -----------------------------------------------------------------------------------------

    program
        .usage("option(s)")
        .description(CommandDefinitions.install.description)
        .parse(process.argv);

    // If no options are passed in, performs installation steps
    if (Js.hasNoArguments()) {
        install.run();
    }

    // #endregion Entrypoint
});
