import { DotnetPath } from "./dotnet-path";
import { Echo } from "./echo";
import upath from "upath";
import { Dir } from "./dir";
import shell from "shelljs";
import { MigrationMode } from "../enums/migration-mode";
import { CollectionUtils } from "andculturecode-javascript-core";
import { CommandStringBuilder } from "../utilities/command-string-builder";
import { OptionStringBuilder } from "../utilities/option-string-builder";
import { Process } from "./process";
import { ProcessResult } from "../interfaces/process-result";

// -----------------------------------------------------------------------------------------
// #region Constants
// -----------------------------------------------------------------------------------------

const MIGRATION_COMMAND = {
    [MigrationMode.ADD]: "migrations add",
    [MigrationMode.DELETE]: "migrations remove",
    [MigrationMode.RUN]: "database update",
};

const OPTIONS = {
    [MigrationMode.ADD]: new OptionStringBuilder("add", "a"),
    [MigrationMode.DELETE]: new OptionStringBuilder("delete", "d"),
    [MigrationMode.RUN]: new OptionStringBuilder("run", "r"),
};

const STARTUP_PROJECT_DIR = DotnetPath.webProjectFilePath() ?? "";

// #endregion Constants

// -----------------------------------------------------------------------------------------
// #region Variables
// -----------------------------------------------------------------------------------------

let _migrationName: string[];
let _mode: MigrationMode;

// #endregion Variables

// -----------------------------------------------------------------------------------------
// #region Functions
// -----------------------------------------------------------------------------------------

const Migration = {
    /**
     * Returns the command string to be executed
     *
     * @param {MigrationMode} mode Type of migration operation being run
     * @param {string} migrationName Name of the migration to run, add or delete
     * @param {string} startupProjectDir Absolute path to the startup project directory (usually a Presentation.Web project)
     * @returns {CommandStringBuilder}
     */
    cmd(
        mode: MigrationMode,
        migrationName: string,
        startupProjectDir: string
    ): CommandStringBuilder {
        return new CommandStringBuilder(
            "dotnet",
            "ef",
            MIGRATION_COMMAND[mode],
            migrationName,
            "--startup-project",
            startupProjectDir,
            "--verbose"
        );
    },
    description(mode: MigrationMode) {
        const migrationName =
            mode === MigrationMode.DELETE ? "" : "<migration name>";
        const cmd = this.cmd(mode, migrationName, STARTUP_PROJECT_DIR);
        switch (mode) {
            case MigrationMode.ADD:
                return `Create new entity framework migration (via ${cmd})`;
            case MigrationMode.DELETE:
                return `Delete most recent entity framework migration (via ${cmd})`;
            case MigrationMode.RUN:
            default:
                return `Run (or revert) entity framework migration (via ${cmd})`;
        }
    },
    getOptions() {
        return OPTIONS;
    },
    migrationName(migrationName: string[]) {
        _migrationName = migrationName;
        return this;
    },
    mode(mode: MigrationMode) {
        _mode = mode;
        return this;
    },
    run() {
        if (!this.validateOrExit()) {
            return;
        }

        DotnetPath.webProjectFilePathOrExit();
        const webProjectFileDir = upath.join(
            shell.pwd(),
            DotnetPath.webProjectFileDir()
        );

        const dataProjectFilePath = DotnetPath.dataProjectFilePathOrExit();
        const dataProjectDir = upath.dirname(dataProjectFilePath);

        const migrationCmd = this.cmd(
            _mode,
            _migrationName[0],
            webProjectFileDir
        );

        Echo.message(`Running EF migration command... (via ${migrationCmd})`);

        Dir.pushd(dataProjectDir);

        Process.spawn(migrationCmd.toString());

        Dir.popd();

        Echo.success(
            "Finished running migration command. Remember to double check that the migration looks right before committing."
        );
    },
    validateOrExit() {
        if (
            (_mode === MigrationMode.ADD || _mode === MigrationMode.RUN) &&
            CollectionUtils.length(_migrationName) !== 1
        ) {
            Echo.error("Migration name is required, and can only be one word.");
            shell.exit(1);
            return false;
        }

        return true;
    },
};

// #endregion Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { Migration };

// #endregion Exports
