#!/usr/bin/env node

import program from "commander";
import shell from "shelljs";
import { CommandRunner } from "./modules/command-runner";
import { DeployConfig } from "./modules/deploy-config";
import { Echo } from "./modules/echo";
import { FrontendPath } from "./modules/frontend-path";
import { Process } from "./modules/process";
import { WebpackPublish } from "./modules/webpack-publish";

CommandRunner.run(async () => {
    // -----------------------------------------------------------------------------------------
    // #region Variables
    // -----------------------------------------------------------------------------------------

    let destination: string;
    let profile: string;
    const pythonInstallerUrl =
        "https://www.python.org/ftp/python/3.7.4/python-3.7.4-amd64.exe";
    let sourcePath = FrontendPath.publishDir();

    // #endregion Variables

    /// -----------------------------------------------------------------------------------------
    // #region Functions
    // -----------------------------------------------------------------------------------------

    // Developer note: This could/should likely be extracted into its own module so that it can be
    // unit tested and export constants for option flags.
    const deployAwsS3 = {
        cmd(src: string, dest: string) {
            return `aws s3 sync ${src} s3://${dest}`;
        },
        description() {
            return "Publish build artifacts to Amazon S3 storage";
        },
        run() {
            // Check system/command requirements
            this.validateOrExit();

            // Configure .env.local to set public url before publish
            if (program.publicUrl) {
                DeployConfig.configurePublicUrl(program.publicUrl);
            }

            // Locally publish frontend via webpack
            if (program.publish && program.webpack) {
                const publishResult = WebpackPublish.run({
                    ci: program.ci,
                    skipClean: program.skipClean,
                    skipRestore: program.skipRestore,
                });

                if (!publishResult) {
                    shell.exit(1);
                }
            }

            // Deploy build artifacts to S3
            Echo.message("Copying local build artifacts to Amazon S3...");
            Echo.message(` - Profile: ${profile}`);
            Echo.message(` - Source path: ${sourcePath}`);
            Echo.message(` - Destination path: ${destination}`);

            const syncCommand =
                this.cmd(sourcePath, destination) + ` --profile ${profile}`;
            Echo.message(` - Command: ${syncCommand}`);

            Process.spawn(syncCommand, {
                onError: () => " - Failed to deploy to AWS S3",
            });

            Echo.newLine();
            Echo.success("Application successfully deployed to AWS S3!");
        },
        validateOrExit() {
            const errors = [];

            // Validate arguments
            profile = program.profile;
            if (profile === undefined || profile === null) {
                errors.push("--profile is required");
            }

            destination = program.destination;
            if (destination === undefined || destination === null) {
                errors.push("--destination is required");
            }

            if (program.source !== undefined && program.source !== null) {
                sourcePath = program.source;
            }

            // Bail if up-front arguments are errored
            if (errors.length > 0) {
                Echo.errors(errors);
                shell.exit(1);
            }

            if (!shell.which("python")) {
                Echo.error(`Python 3.7+ is required - ${pythonInstallerUrl}`);
                shell.exit(1);
            }

            if (!shell.which("pip")) {
                Echo.error(`PIP is required - ${pythonInstallerUrl}`);
                shell.exit(1);
            }

            if (!shell.which("aws")) {
                Echo.message("AWS CLI not found. Installing via PIP...");

                // Unfortunately we must lock down our awscli and awsebcli versions so they use compatible dependencies https://github.com/aws/aws-cli/issues/3550
                Process.spawn("pip install awscli==1.16.9", {
                    onError: () => "Failed to install aws cli via pip",
                });

                Echo.success(" - Successfully installed AWS CLI");
            }

            // Handle errors
            if (errors.length > 0) {
                Echo.errors(errors);
                shell.exit(1);
            }

            return true;
        },
    };

    // #endregion Functions

    // -----------------------------------------------------------------------------------------
    // #region Entrypoint
    // -----------------------------------------------------------------------------------------

    program
        .usage("option")
        .description(deployAwsS3.description())
        .option(
            "--destination <destination>",
            "Required container/bucket folder path (ie. my-bucket/path/to/folder)"
        )
        .option(
            "--profile <profile>",
            "Required AWS S3 profile configured in either ~/.aws/config or ~/.aws/credentials"
        )
        .option(
            "--public-url <url>",
            "Optional URL replaced in release files (ie. absolute S3 bucket URL)"
        )
        .option("--publish", "Optional flag to run a webpack publish")
        .option(
            "--source <source>",
            `Optional path of folder to copy from this machine. Default is '${FrontendPath.publishDir()}'`
        )
        .option("--webpack", "Deploy webpack built frontend application")
        .option("--ci", "Restore npm packages with npm ci", false)
        .option("--skip-clean", "Skip npm clean", false)
        .option("--skip-restore", "Skip npm restore", false)
        .parse(process.argv);

    await deployAwsS3.run();

    // #endregion Entrypoint
});
