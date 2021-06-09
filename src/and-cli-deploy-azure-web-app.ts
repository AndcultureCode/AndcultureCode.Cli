#!/usr/bin/env node

import { Azure } from "./modules/azure";
import { CommandRunner } from "./modules/command-runner";
import { Echo } from "./modules/echo";
import program from "commander";
import shell from "shelljs";
import { Process } from "./modules/process";

CommandRunner.run(async () => {
    // -----------------------------------------------------------------------------------------
    // #region Variables
    // -----------------------------------------------------------------------------------------

    let appName: string;
    let branch: string;
    let clientId: string;
    let force: boolean = false;
    let remote: string;
    let resourceGroup: string;
    let secret: string;
    let tenantId: string;
    let username: string;

    // #endregion Variables

    /// -----------------------------------------------------------------------------------------
    // #region Functions
    // -----------------------------------------------------------------------------------------

    // At some point, these git commands should be put into a shared module, see https://github.com/AndcultureCode/AndcultureCode.Cli/issues/91
    const deployAzureWebApp = {
        createRemoteIfMissing() {
            const { code: checkRemoteExistsCode } = Process.spawn(
                `git remote get-url ${remote}`,
                {
                    exitOnError: false,
                }
            );

            if (checkRemoteExistsCode === 0) {
                return;
            }

            let credentialsArgs = `--name ${appName} --resource-group ${resourceGroup} --query scmUri --output tsv`;

            if (program.slot != null) {
                credentialsArgs += ` --slot ${program.slot}`;
            }

            const {
                stdout: url,
            } = Process.spawn(
                `az webapp deployment list-publishing-credentials ${credentialsArgs}`,
                { exitOnError: false }
            );

            Process.spawn(`git remote add ${remote} ${url}`, {
                onError: () => {
                    Azure.logout();
                    return "Error trying to add remote!";
                },
            });
        },
        description() {
            return `Pushes indicated branch from the current git repo to indicated Azure Web App git repo, which then deploys to configured Azure Web App environment`;
        },
        pushToRemote() {
            let pushCmd = `git push ${remote} ${branch}:master`;

            if (force) {
                pushCmd += " -f";
            }

            Process.spawn(pushCmd, {
                onError: () => {
                    Azure.logout();
                    return " - Failed pushing to Web App remote";
                },
            });
        },
        async run() {
            // Check system/command requirements
            this.validateOrExit();

            // Login to Azure
            if (username != null) {
                Azure.login(username, secret);
            } else {
                Azure.login(clientId, tenantId, secret);
            }

            this.createRemoteIfMissing();

            this.pushToRemote();

            // Logout from Azure
            Azure.logout();

            Echo.newLine();
            Echo.success("Application successfully deployed to Azure Web App!");
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

            appName = program.appName;
            if (appName == null) {
                errors.push("--app-name is required");
            }

            resourceGroup = program.resourceGroup;
            if (resourceGroup == null) {
                errors.push("--resource-group is required");
            }

            branch = program.branch;
            if (branch == null) {
                errors.push("--branch is required");
            }

            remote = program.remote;
            if (remote == null) {
                errors.push("--remote is required");
            }

            // Bail if up-front arguments are errored
            if (errors.length > 0) {
                Echo.errors(errors);
                shell.exit(1);
            }

            if (program.force != null) {
                force = true;
            }

            Azure.validateAzCli();

            return true;
        },
    };

    // #endregion Functions

    // -----------------------------------------------------------------------------------------
    // #region Entrypoint
    // -----------------------------------------------------------------------------------------

    program
        .usage("option")
        .description(deployAzureWebApp.description())
        .option(
            "--app-name <applicationName>",
            "Required name of the Azure Web App"
        )
        .option("--branch <branch>", "Required name of the branch to deploy")
        .option(
            "--client-id <clientID>",
            "Required Client ID (if deploying using Service Principal)"
        )
        .option(
            "--force",
            "Optional flag indicating you want to force push to the git remote"
        )
        .option(
            "--remote <remote>",
            "Required name of the git remote used for Azure Web App deploys (will be created if it does not exist)"
        )
        .option(
            "--resource-group <resourceGroup>",
            "Required name of the resource group to which the Azure Web App belongs"
        )
        .option(
            "--secret <profile>",
            "Required secret for login -- either client secret for service principal or account password"
        )
        .option(
            "--tenant-id <tenantID>",
            "Required Tenant ID (if deploying using Service Principal)"
        )
        .option(
            "--username <username>",
            "Required Azure username (if deploying using Azure credentials)"
        )
        .option(
            "--slot <slot>",
            "Optional name of slot to which you want to deploy (uses production slot by default)"
        )
        .parse(process.argv);

    await deployAzureWebApp.run();

    // #endregion Entrypoint
});
