#!/usr/bin/env node
import { CommandRunner } from "./modules/command-runner";
import { Dir } from "./modules/dir";
import { DotnetPath } from "./modules/dotnet-path";
import { DotnetPublish } from "./modules/dotnet-publish";
import { Echo } from "./modules/echo";
import { File } from "./modules/file";
import { Zip } from "./modules/zip";
import program from "commander";
import shell from "shelljs";
import { Process } from "./modules/process";

CommandRunner.run(async () => {
    // -----------------------------------------------------------------------------------------
    // #region Variables
    // -----------------------------------------------------------------------------------------

    const pythonInstallerUrl =
        "https://www.python.org/ftp/python/3.7.4/python-3.7.4-amd64.exe";
    let timeout = `--timeout 20`; // Default AWSEBCLI command timeout in minutes
    let verbose = "";

    // #endregion Variables

    // -----------------------------------------------------------------------------------------
    // #region Functions
    // -----------------------------------------------------------------------------------------

    const deployAwsBeanstalk = {
        cmds: {
            deploy: "eb deploy",
        },
        description() {
            return `Runs dotnet publish on ${DotnetPath.solutionPath()} solution and deploys to configured AWS Elastic Beanstalk environment`;
        },
        async run() {
            // Check system requirements
            this.validateOrExit();

            // Handling incoming arguments
            if (program.timeout) {
                timeout = `--timeout ${program.timeout}`;
            }
            if (program.verbose) {
                verbose = "--verbose";
            }

            let projectDir = "";

            // Publish dotnet if enabled
            if (program.dotnet) {
                DotnetPublish.run();
                projectDir = `${DotnetPath.solutionDir()}/`;
            }

            // Create inner release zip
            const innerReleaseFilename = "release.zip";
            const innerReleaseDir = `${projectDir}release`;
            const innerReleaseZipFile = `${projectDir}${innerReleaseFilename}`;
            File.deleteIfExists(innerReleaseZipFile);
            await Zip.create(
                [{ source: innerReleaseDir, destination: "/" }],
                null,
                innerReleaseZipFile
            );

            // Create outer bundle release zip
            const awsBundleManifestFilename =
                "aws-windows-deployment-manifest.json"; // TODO: Refactor to intelligently locate aws manifest file (ie. don't assume windows)
            const awsBundleManifestFile = `${projectDir}${awsBundleManifestFilename}`;
            const outerReleaseZipFile = `${projectDir}release-bundle.zip`;
            File.deleteIfExists(outerReleaseZipFile);

            const inputDirectories = [];
            const awsBundleExtensionsDirname = ".ebextensions";
            const awsBundleExtensionsDir = `${projectDir}${awsBundleExtensionsDirname}`;
            if (shell.test("-e", awsBundleExtensionsDir)) {
                Echo.message("Adding .ebextensions directory");
                inputDirectories.push({
                    source: awsBundleExtensionsDir,
                    destination: awsBundleExtensionsDirname,
                });
            }

            const inputFiles = [
                {
                    source: innerReleaseZipFile,
                    destination: innerReleaseFilename,
                },
                {
                    source: awsBundleManifestFile,
                    destination: awsBundleManifestFilename,
                },
            ];
            await Zip.create(inputDirectories, inputFiles, outerReleaseZipFile);

            // Call EB deploy
            Echo.message(
                "Deploying to AWS beanstalk. Check AWS console for realtime output. This could take a few minutes..."
            );

            Process.spawn(`${this.cmds.deploy} ${timeout} ${verbose}`, {
                onError: () => " - Failed to deploy to AWS beanstalk",
            });

            // Cleanup
            Dir.deleteIfExists(innerReleaseDir);
            File.deleteIfExists(innerReleaseZipFile);
            File.deleteIfExists(outerReleaseZipFile);

            Echo.newLine();
            Echo.success("Application successfully deployed to AWS beanstalk!");
        },

        validateOrExit() {
            if (!shell.which("python")) {
                Echo.error(`Python 3.7+ is required - ${pythonInstallerUrl}`);
                shell.exit(1);
            }

            if (!shell.which("pip")) {
                Echo.error(`PIP is required - ${pythonInstallerUrl}`);
                shell.exit(1);
            }

            if (!shell.which("eb")) {
                Echo.message("AWS EB CLI not found. Installing via PIP...");

                // Unfortunately we must lock down our awscli and awsebcli versions so they use compatible dependencies https://github.com/aws/aws-cli/issues/3550
                Process.spawn("pip install awsebcli==3.14.4", {
                    onError: () => "Failed to install eb cli via pip",
                });

                Echo.success(" - Successfully installed AWS EB CLI");
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
        .description(deployAwsBeanstalk.description())
        .option("--dotnet", "Deploy dotnet core application via beanstalk")
        .option(
            "--timeout <timeout>",
            `Optional elastic beanstalk deploy timeout. Default is ${timeout} minutes. When exceeded, exits with error`
        )
        .option("--verbose", "Stream events from AWS")
        .parse(process.argv);

    await deployAwsBeanstalk.run();

    // #endregion Entrypoint
});
