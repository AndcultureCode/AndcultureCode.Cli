#!/usr/bin/env node

import { StringUtils } from "andculturecode-javascript-core";
import { CommandStringBuilder } from "./utilities/command-string-builder";
import { OptionStringBuilder } from "./utilities/option-string-builder";
import { Echo } from "./modules/echo";
import { File } from "./modules/file";
import { Jenkins } from "./modules/jenkins";
import { Js } from "./modules/js";
import { CommandRunner } from "./modules/command-runner";
import program from "commander";
import { Prompt } from "./modules/prompt";
import shell from "shelljs";
import { Process } from "./modules/process";

CommandRunner.run(async () => {
    // -----------------------------------------------------------------------------------------
    // #region Constants
    // -----------------------------------------------------------------------------------------

    const INIT_OPTION = new OptionStringBuilder("init", "i");
    const NEW_PROFILE_OPTTION = new OptionStringBuilder("new");
    const PROFILE_OPTION = new OptionStringBuilder("profile <profile>", "p");
    const SHOW_OPTION = new OptionStringBuilder("show");

    // #endregion Constants

    // -----------------------------------------------------------------------------------------
    // #region Variables
    // -----------------------------------------------------------------------------------------

    let tag: string;
    let job: string;

    // #endregion Variables

    // -----------------------------------------------------------------------------------------
    // #region Functions
    // -----------------------------------------------------------------------------------------

    const JenkinsDeploy = {
        async build() {
            const { profile } = program;
            if (StringUtils.isEmpty(profile)) {
                Echo.error(
                    `Please specify a profile (${PROFILE_OPTION}) to trigger`
                );
                shell.exit(1);
            }

            const config = Jenkins.getConfig();
            job = config.profiles[profile];
            if (job == null) {
                Echo.error(
                    "Profile not found, please check your configuration"
                );
                shell.exit(1);
            }

            tag = await Prompt.questionAsync("Tag name to deploy: ");
            this.validateOrExit();

            await Prompt.confirmOrExit(
                `Please confirm deployment of tag ${tag} to ${job}`
            );

            Echo.message(`Jenkins starting ${job}, deploying version ${tag}`);
            const url = encodeURI(
                `${config.url}/job/${job}/buildWithParameters?version=${tag}`
            );

            const cmd = new CommandStringBuilder(
                "curl",
                "-X",
                "POST",
                "-L",
                `--user ${config.username}:${config.token}`,
                url
            );

            Process.spawn(cmd.toString(), {
                onError: () => " - Failed to deploy Jenkins",
            });
        },
        async createProfile() {
            const jobName = await Prompt.questionAsync(
                "Enter the Job name exactly as it appears in the Jenkins Web UI "
            );
            const profileName = await Prompt.questionAsync(
                "Profile name (Friendly name for you to remember): "
            );

            let config = Jenkins.getConfig();
            let profiles = config.profiles;

            if (profiles == null) {
                profiles = Object.create(null);
            }
            profiles[profileName] = jobName;
            config.profiles = profiles;

            Jenkins.writeToConfig(config);
        },
        async init() {
            const configPath = Jenkins.getConfigPath();

            await Prompt.confirmOrExit(
                "This operation will overwrite any existing configurations. Continue?"
            );

            File.deleteIfExists(configPath);
            shell.touch(configPath);

            const url = await Prompt.questionAsync("Jenkins Server Url: ");
            const username = await Prompt.questionAsync("Jenkins Username: ");
            const token = await Prompt.questionAsync("Jenkins API Token: ");

            let config = Jenkins.getConfig();
            config = Object.assign(config, { url, username, token });

            const configResult = Jenkins.writeToConfig(config);
            if (!configResult) {
                Echo.error("Error writing to config file");
                shell.exit(1);
            }
            await Prompt.confirmOrExit("Success, add job profile?");
            await this.createProfile();
        },
        async showConfig() {
            const config = Jenkins.getConfig();
            if (config == null) {
                Echo.error(
                    `No configuration found. Please run ${INIT_OPTION} to setup the configuration file.`
                );
                shell.exit(1);
            }

            Echo.json(config);
        },
        validateOrExit() {
            const errors = [];
            const config = Jenkins.getConfig();
            if (
                StringUtils.isEmpty(config.url) ||
                StringUtils.isEmpty(config.username) ||
                StringUtils.isEmpty(config.token)
            ) {
                errors.push("Credentials not found");
            }

            if (StringUtils.isEmpty(job)) {
                errors.push("job is required");
            }

            if (StringUtils.isEmpty(tag)) {
                errors.push("tag is required");
            }

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
        .description("Trigger a build through Jenkins remotely")
        .option(INIT_OPTION.toString(), "Configure Jenkins credentials")
        .option(
            NEW_PROFILE_OPTTION.toString(),
            "Configure a profile for a Jenkins job"
        )
        .option(PROFILE_OPTION.toString(), "Profile selected to trigger")
        .option(SHOW_OPTION.toString(), "Show current configuration")
        .parse(process.argv);

    if (Js.hasNoArguments()) {
        program.help();
    }

    if (program.init) {
        await JenkinsDeploy.init();
        return;
    }

    if (program.new) {
        await JenkinsDeploy.createProfile();
        return;
    }

    if (program.show) {
        await JenkinsDeploy.showConfig();
        return;
    }

    await JenkinsDeploy.build();

    // #endregion Entrypoint
});
