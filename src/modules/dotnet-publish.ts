import { StringUtils } from "andculturecode-javascript-core";
import { Dir } from "./dir";
import { DotnetPath } from "./dotnet-path";
import { Echo } from "./echo";
import shell from "shelljs";
import { OptionStringBuilder } from "../utilities/option-string-builder";
import { Options } from "../constants/options";
import { Process } from "./process";

// -----------------------------------------------------------------------------------------
// #region Constants
// -----------------------------------------------------------------------------------------

const ERROR_PUBLISH_FAILED = "Failed to publish dotnet project";
const PUBLISH_SUCCESS = " - Dotnet solution published";

// #endregion Constants

// -----------------------------------------------------------------------------------------
// #region Functions
// -----------------------------------------------------------------------------------------

const DotnetPublish = {
    ERROR_PUBLISH_FAILED,
    PUBLISH_SUCCESS,
    cmd(outputDirectory?: string): string {
        const command = "dotnet publish";
        if (StringUtils.isEmpty(outputDirectory)) {
            return command;
        }

        return `${command} -o "${outputDirectory}"`;
    },
    description() {
        return `Publishes the dotnet solution from the root of the project (via ${this.cmd()})`;
    },
    getOptions(): OptionStringBuilder {
        return Options.Publish;
    },
    /**
     * Runs a publish of the dotnet solution to the local file system
     * @param absoluteOutputDir Optional absolute path of release output directory. If not provided,
     * defaults to dotnet solution's 'release' directory
     */
    run(absoluteOutputDir?: string) {
        // Verify a solution can be found before attempting to publish
        DotnetPath.solutionPathOrExit();

        if (StringUtils.isEmpty(absoluteOutputDir)) {
            absoluteOutputDir = DotnetPath.releaseDir();
        }

        _cleanReleaseDir(absoluteOutputDir!);

        Dir.pushd(DotnetPath.solutionDir()!);

        _publishSolution(absoluteOutputDir!);

        Dir.popd();
    },
};

// #endregion Functions

// -----------------------------------------------------------------------------------------
// #region Private Functions
// -----------------------------------------------------------------------------------------

const _cleanReleaseDir = (absoluteOutputDir: string) => {
    Echo.message(`Cleaning release directory '${absoluteOutputDir}'...`);
    const { code } = shell.rm("-rf", absoluteOutputDir!);

    if (code === 0) {
        Echo.success(" - Successfully cleaned released directory");
        Echo.newLine();
        return;
    }

    const errorMessage = `Failed to clean release directory '${absoluteOutputDir}': ${code}`;
    Echo.error(errorMessage);
    shell.exit(code);
};

const _publishSolution = (absoluteOutputDir: string) => {
    const commandBuilder = DotnetPublish.cmd(absoluteOutputDir);

    const publishMessage = `Publishing dotnet solution (via ${commandBuilder.toString()})...`;
    Echo.message(publishMessage);

    Process.spawn(commandBuilder.toString(), {
        onError: () => ERROR_PUBLISH_FAILED,
    });

    Echo.success(PUBLISH_SUCCESS);
};

// #endregion Private Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { DotnetPublish };

// #endregion Exports
