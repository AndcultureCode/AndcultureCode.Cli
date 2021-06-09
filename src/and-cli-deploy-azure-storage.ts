#!/usr/bin/env node

import program from "commander";
import shell from "shelljs";
import { Azure } from "./modules/azure";
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

    let clientId: string;
    let destination: string;
    const pythonInstallerUrl: string =
        "https://www.python.org/ftp/python/3.7.4/python-3.7.4-amd64.exe";
    let recursive: boolean = false;
    let secret: string;
    let sourcePath: string = FrontendPath.publishDir() + "/*";
    let tenantId: string;
    let username: string;

    // #endregion Variables

    /// -----------------------------------------------------------------------------------------
    // #region Functions
    // -----------------------------------------------------------------------------------------

    const deployAzureStorage = {
        cmd() {
            let command = `az storage copy -s ${sourcePath} -d ${destination}`;

            if (recursive) {
                command += " --recursive";
            }

            return command;
        },
        description() {
            return "Publish build artifacts to Azure Storage";
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

            // Login to Azure
            if (username != null) {
                Azure.login(username, secret);
            } else {
                Azure.login(clientId, tenantId, secret);
            }

            // Deploy build artifacts to Azure Storage
            Echo.message("Copying local build artifacts to Azure Storage...");
            Echo.message(` - Source path: ${sourcePath}`);
            Echo.message(` - Destination path: ${destination}`);

            const copyCommand = this.cmd();
            Echo.message(` - Command: ${copyCommand}`);
            Process.spawn(copyCommand, {
                onError: () => {
                    Azure.logout();
                    return " - Failed to deploy to Azure Storage";
                },
            });

            // Logout from Azure
            Azure.logout();

            Echo.newLine();
            Echo.success("Application successfully deployed to Azure Storage!");
        },
        validateOrExit() {
            const errors = [];

            // Validate arguments
            clientId = program.clientId;
            tenantId = program.tenantId;
            username = program.username;

            const missingServicePrincipalArgs =
                clientId == null || tenantId == null;

            if (username == null && missingServicePrincipalArgs) {
                errors.push(
                    "when --client-id or --tenant-id not provided, --username is required"
                );
            }

            secret = program.secret;
            if (secret == null) {
                errors.push("--secret is required");
            }

            destination = program.destination;
            if (destination == null) {
                errors.push("--destination is required");
            }

            if (program.source != null) {
                sourcePath = program.source;
            }

            if (program.recursive != null) {
                recursive = program.recursive;
            }

            // Bail if up-front arguments are errored
            if (errors.length > 0) {
                Echo.errors(errors);
                shell.exit(1);
            }

            if (!shell.which("az")) {
                Echo.message(
                    "Azure CLI not found. Attempting install via PIP..."
                );

                if (!shell.which("pip")) {
                    Echo.error(`PIP is required - ${pythonInstallerUrl}`);
                    shell.exit(1);
                }

                Process.spawn("pip install azure-cli", {
                    onError: () => "Failed to install azure cli via pip",
                });

                Echo.success(" - Successfully installed Azure CLI");
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
        .description(deployAzureStorage.description())
        .option(
            "--client-id <clientID>",
            "Required Client ID (if deploying using Service Principal)"
        )
        .option(
            "--destination <destination>",
            "Required absolute container URL path (ie. https://workingenv.blob.core.windows.net/folder/subfolder)"
        )
        .option(
            "--public-url <url>",
            "Optional URL replaced in release files (ie. absolute Azure CDN or container URL)"
        )
        .option("--publish", "Optional flag to run a webpack publish")
        .option("--recursive", "Optional flag to recursively deploy a folder")
        .option(
            "--secret <profile>",
            "Required secret for login -- either client secret for service principal or account password"
        )
        .option(
            "--source <source>",
            `Optional path of folder to copy from this machine. Default is '${FrontendPath.publishDir()}'`
        )
        .option(
            "--tenant-id <tenantID>",
            "Required Tenant ID (if deploying using Service Principal)"
        )
        .option(
            "--username <username>",
            "Required Azure username (if deploying using Azure credentials)"
        )
        .option("--webpack", "Deploy webpack built frontend application")
        .option(
            "--ci",
            "Restore npm packages with npm ci in webpack-publish",
            false
        )
        .option("--skip-clean", "Skip npm clean", false)
        .option("--skip-restore", "Skip npm restore", false)
        .parse(process.argv);

    await deployAzureStorage.run();

    // #endregion Entrypoint
});
