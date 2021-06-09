#!/usr/bin/env node

import { CommandDefinitions } from "./modules/command-definitions";
import { Constants } from "./modules/constants";
import { DotnetPath } from "./modules/dotnet-path";
import { Echo } from "./modules/echo";
import { NugetUpgrade } from "./modules/nuget-upgrade";
import program from "commander";
import shell from "shelljs";
import { CommandRunner } from "./modules/command-runner";
import { Js } from "./modules/js";
import { CollectionUtils } from "andculturecode-javascript-core";
import { NugetCommand } from "./enums/nuget-command";
import { CommandStringBuilder } from "./utilities/command-string-builder";
import { OptionStringBuilder } from "./utilities/option-string-builder";
import { Process } from "./modules/process";

CommandRunner.run(async () => {
    // -----------------------------------------------------------------------------------------
    // #region Constants
    // -----------------------------------------------------------------------------------------

    const NUGET_URL = "https://api.nuget.org/v3/index.json";
    const SOLUTION_PATH = DotnetPath.solutionPath() ?? "";

    // #endregion Constants

    // -----------------------------------------------------------------------------------------
    // #region Public Functions
    // -----------------------------------------------------------------------------------------

    const NugetPublish = {
        cmd(command: NugetCommand, file?: string) {
            switch (command) {
                case NugetCommand.PUBLISH:
                    file = file ?? "";
                    return _publishCmd(file);
                case NugetCommand.PACK:
                default:
                    return _packCmd();
            }
        },
        description() {
            return "Publishes NuGet packages for dotnet core projects";
        },
        getOptions() {
            return new OptionStringBuilder("publish <version>", "p");
        },
        run() {
            // Verify the solution path can be found or exit
            DotnetPath.solutionPathOrExit();

            const publishVersion = program.publish;

            if (!publishVersion.match(Constants.VERSION_REGEX_PATTERN)) {
                Echo.error(Constants.ERROR_INVALID_VERSION_STRING);
                shell.exit(1);
                return;
            }

            Echo.message(`Publishing version '${publishVersion}'...`);

            // Update version number in .csproj files
            shell.ls("**/*.csproj").forEach((file: string) => {
                shell.sed(
                    "-i",
                    "<Version>(.*)</Version>",
                    `<Version>${publishVersion}</Version>`,
                    file
                );
            });

            // Create new nupkg file
            const packCmd = this.cmd(NugetCommand.PACK);
            Echo.message(`Packaging ${SOLUTION_PATH}... (via ${packCmd})`);
            Process.spawn(packCmd.toString(), {
                onError: () => "Failed to pack dotnet project",
            });

            // Push nupkg to nuget servers
            const errored: string[] = [];
            const successful: string[] = [];
            shell.ls(`**/*.${publishVersion}.nupkg`).forEach((file: string) => {
                const publishCmd = this.cmd(NugetCommand.PUBLISH, file);
                Echo.message(
                    `Publishing package ${file}... (via ${publishCmd})`
                );

                const { code } = Process.spawn(publishCmd.toString(), {
                    exitOnError: false,
                });

                if (code !== 0) {
                    errored.push(file);
                    Echo.error(`[FAILED] Publishing nuget package: '${file}'`);
                    return;
                }

                Echo.success(`[SUCCESS] Publishing nuget package: '${file}'`);
                successful.push(file);
            });

            // Error output
            if (CollectionUtils.hasValues(errored)) {
                Echo.error(
                    `Failed to publish ${
                        errored.length
                    } nuget package(s): ${JSON.stringify(errored)}`
                );
                shell.exit(1);
            }

            Echo.success(`Successfully published version ${publishVersion}`);
        },
    };

    // #endregion Public Functions

    // -----------------------------------------------------------------------------------------
    // #region Private Functions
    // -----------------------------------------------------------------------------------------

    const _packCmd = () =>
        new CommandStringBuilder("dotnet", "pack", SOLUTION_PATH);

    const _publishCmd = (file: string) =>
        new CommandStringBuilder(
            "dotnet",
            "nuget",
            "push",
            file,
            "-s",
            NUGET_URL
        );

    // #endregion Private Functions

    // -----------------------------------------------------------------------------------------
    // #region Entrypoint
    // -----------------------------------------------------------------------------------------

    program
        .usage("option(s)")
        .description(CommandDefinitions.nuget.description)
        .option(
            NugetPublish.getOptions().toString(),
            NugetPublish.description()
        )
        .option(
            NugetUpgrade.getOptions().toString(),
            NugetUpgrade.description()
        )
        .parse(process.argv);

    if (program.publish) {
        NugetPublish.run();
    }

    if (program.upgrade) {
        await NugetUpgrade.run();
    }

    // If no options are passed in, output help
    if (Js.hasNoArguments()) {
        program.help();
    }

    // #endregion Entrypoint
});
