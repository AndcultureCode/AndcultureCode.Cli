import { CollectionUtils, StringUtils } from "andculturecode-javascript-core";
import { CommandStringBuilder } from "../utilities/command-string-builder";
import { OptionStringBuilder } from "../utilities/option-string-builder";
import { DotnetPath } from "./dotnet-path";
import { Echo } from "./echo";
import { DotnetBuild } from "./dotnet-build";
import { Dir } from "./dir";
import shell from "shelljs";
import { SpawnIOMode } from "../enums/spawn-io-mode";
import { Process } from "./process";
import { ProcessResult } from "../interfaces/process-result";

// -----------------------------------------------------------------------------------------
// #region Interfaces
// -----------------------------------------------------------------------------------------

/**
 * @example
 * // An example of the result object to be returned. Code = 0 signifies a successful run,
 * // while any other code signifies a failure.
 *  {
 *      code: 1,
 *      name: "ExampleProject.Core.Tests",
 *      stderr: "...",
 *      stdout: "...",
 *  }
 */
interface ProjectTestResult extends ProcessResult {
    name: string;
}
// #endregion Interfaces

// -----------------------------------------------------------------------------------------
// #region Constants
// -----------------------------------------------------------------------------------------

const BASE_COMMAND_STRING: CommandStringBuilder = new CommandStringBuilder(
    "dotnet",
    "test",
    "--no-build",
    "--no-restore"
);
const COVERAGE_FLAGS: string =
    "-p:CollectCoverage=true -p:CoverletOutputFormat=opencover";

// OptionStrings must be defined before object containing them (DOTNET_TEST_OPTIONS)
const BY_PROJECT_OPTION_STRING: OptionStringBuilder = new OptionStringBuilder(
    "by-project"
);
const CI_OPTION_STRING: OptionStringBuilder = new OptionStringBuilder("ci");
const COVERAGE_OPTION_STRING: OptionStringBuilder = new OptionStringBuilder(
    "coverage"
);
const SKIP_CLEAN_OPTION_STRING: OptionStringBuilder = new OptionStringBuilder(
    "skip-clean",
    "s"
);

const DOTNET_TEST_OPTIONS: Record<string, OptionStringBuilder> = {
    BY_PROJECT: BY_PROJECT_OPTION_STRING,
    CI: CI_OPTION_STRING,
    COVERAGE: COVERAGE_OPTION_STRING,
    SKIP_CLEAN: SKIP_CLEAN_OPTION_STRING,
};

// #endregion Constants

// -----------------------------------------------------------------------------------------
// #region Variables
// -----------------------------------------------------------------------------------------

let _ciMode: boolean = false;
let _filter: string[] = [];
let _skipClean: boolean = false;
let _withCoverage: boolean = false;

// #endregion Variables

// -----------------------------------------------------------------------------------------
// #region Private Functions
// -----------------------------------------------------------------------------------------

/**
 * Builds out the final command string based on configured variables in this module
 *
 * If no project is provided, it assumes we are running the entire solution.
 *
 * @param {string} [project=""]
 */
const _buildCommandString = (project = "") => {
    const { cmd } = BASE_COMMAND_STRING;
    // Clone the args from the base command so we aren't manipulating the same references
    let args = [...BASE_COMMAND_STRING.args];

    if (_withCoverage) {
        // The two coverage flags need to be pushed onto the args array before the project name
        // it seems. The dotnet command was not recognizing them at the end of the args array.
        args.push(COVERAGE_FLAGS);
    }

    if (StringUtils.hasValue(project)) {
        args.push(project);
    }

    if (CollectionUtils.isEmpty(_filter)) {
        return new CommandStringBuilder(cmd, ...args);
    }

    // If we have filters to apply, further modification on the args array is necessary
    // Remove the project from the args array & place at end to ensure it is the last value
    // passed to dotnet test
    args = args
        .filter((arg) => arg !== project)
        .concat("--filter", _filter, project);
    return new CommandStringBuilder(cmd, ...args);
};

/**
 * Builds the informational message for which project or solution is about to be tested.
 *
 * If no project is provided, it assumes we are running the entire solution.
 *
 * @param {CommandString} commandString
 * @param {string} [project=""]
 * @returns
 */
const _buildMessage = (
    commandString: string | CommandStringBuilder,
    project = ""
) => {
    const runningSolution = StringUtils.isEmpty(project);
    const hasFilter = CollectionUtils.hasValues(_filter);

    // Running entire solution with a filter
    if (runningSolution && hasFilter) {
        return `Running tests in the ${DotnetPath.solutionPath()} solution that match the xunit filter of '${_filter}' via (${commandString})`;
    }

    // Running entire solution w/o filter
    if (runningSolution) {
        return `Running all tests in the ${DotnetPath.solutionPath()} solution... via (${commandString})`;
    }

    // Running by project with a filter
    if (hasFilter) {
        return `Running tests in the ${project} project that match the xunit filter of '${_filter}' via (${commandString})`;
    }

    // Running by project w/o filter
    return `Running tests in the ${project} project... via (${commandString})`;
};

// #endregion Private Functions

// -----------------------------------------------------------------------------------------
// #region Functions
// -----------------------------------------------------------------------------------------

const DotnetTest = {
    ciMode(ciMode?: boolean) {
        if (ciMode != null) {
            _ciMode = ciMode;
        }

        return this;
    },
    cmd(): CommandStringBuilder {
        return BASE_COMMAND_STRING;
    },
    description() {
        return `Runs dotnet test runner on the ${DotnetPath.solutionPath()} solution (via ${this.cmd()})`;
    },
    getOptions() {
        return DOTNET_TEST_OPTIONS;
    },
    filter(filter?: string[]) {
        if (filter != null) {
            _filter = filter;
        }

        return this;
    },
    /**
     * Runs dotnet test synchronously for the given test project
     *
     * @param {string} project The name of the test project to be run.
     * @returns {ProjectTestResult} An object containing the project name, exit code, and stdout/stderr if 'ciMode' is true.
     */
    runProject(project: string): ProjectTestResult {
        // Build out the full command string as well as informational message based on configuration
        const commandString = _buildCommandString(project);
        const message = _buildMessage(commandString, project);

        Echo.message(message);

        // Determine the stdio mode based on whether or not this is being run in ci mode.
        // If in ci mode, we need to pipe output to capture stdout/stderr for the output summary.
        const stdio = _ciMode ? SpawnIOMode.Pipe : SpawnIOMode.Inherit;
        const result = Process.spawn(commandString.toString(), {
            exitOnError: false,
            stdio,
        });

        // We only need to manually output stdout/stderr in ci mode since we're piping it.
        // For regular use, stdout/stderr will be inherited and output automatically.
        if (_ciMode) {
            Echo.message(result.stdout);

            if (StringUtils.hasValue(result.stderr)) {
                Echo.error(result.stderr);
            }
        }

        return {
            ...result,
            name: project,
        };
    },
    runSolutionByProject() {
        // Check for the solution path before attempting any work
        DotnetPath.solutionPathOrExit();

        if (!_skipClean) {
            DotnetBuild.run(true, true);
        }

        const solutionDir = DotnetPath.solutionDir();
        Dir.pushd(solutionDir!);

        const testProjects = shell.find("**/*.Test*.csproj");
        if (CollectionUtils.isEmpty(testProjects)) {
            Echo.error(
                "Could not find any csproj files matching the pattern *.Test*.csproj."
            );
            shell.exit(1);
        }

        Echo.message(
            `Found ${
                testProjects.length
            } test projects in the ${DotnetPath.solutionDir()} solution...`
        );

        // Call runProject() for each project found that matches the pattern. This will return an object containing
        // the project name, exit status and stdout/stderr (if in ci mode)
        const results = testProjects.map((testProject: string) =>
            this.runProject(testProject)
        );

        // Check the results array for any non-zero exit codes and display helpful output for each
        const failedProjects = results.filter(
            (testResult: ProjectTestResult) => testResult.code !== 0
        );
        if (CollectionUtils.isEmpty(failedProjects)) {
            Dir.popd();
            Echo.newLine();
            Echo.message("Exited dotnet-test");
            return 0;
        }

        failedProjects.forEach((testResult: ProjectTestResult) => {
            if (_ciMode) {
                Echo.headerError(`Failed tests for ${testResult.name}`);
                Echo.error(testResult.stderr);

                return;
            }

            Echo.error(
                `Tests failed for ${testResult.name}. Scroll up or search the output for the project name for more detail.`
            );
        });

        Echo.error(
            `${failedProjects.length} test projects exited with non-zero exit status. See above output for more detail.`
        );
        shell.exit(1);
    },
    runBySolution() {
        // Check for the solution path before attempting any work
        DotnetPath.solutionPathOrExit();

        if (!_skipClean) {
            DotnetBuild.run(true, true);
        }

        const solutionDir = DotnetPath.solutionDir();

        Dir.pushd(solutionDir!);

        // Build out the full command string as well as informational message based on configuration
        const commandString = _buildCommandString();
        const message = _buildMessage(commandString);

        Echo.message(message);

        Process.spawn(commandString.toString());

        Dir.popd();
        Echo.newLine();
        Echo.message("Exited dotnet-test");
    },
    skipClean(skipClean?: boolean) {
        if (skipClean != null) {
            _skipClean = skipClean;
        }

        return this;
    },
    withCoverage(withCoverage?: boolean) {
        if (withCoverage != null) {
            _withCoverage = withCoverage;
        }

        return this;
    },
};

// #endregion Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { DotnetTest };

// #endregion Exports
