import { OptionStringBuilder } from "../utilities/option-string-builder";
import { Dir } from "./dir";
import { DotnetClean } from "./dotnet-clean";
import { DotnetPath } from "./dotnet-path";
import { DotnetRestore } from "./dotnet-restore";
import { Echo } from "./echo";
import { Process } from "./process";

// -----------------------------------------------------------------------------------------
// #region Constants
// -----------------------------------------------------------------------------------------

const RUN_OPTION: OptionStringBuilder = new OptionStringBuilder("run", "r");
const WATCH_OPTION: OptionStringBuilder = new OptionStringBuilder("watch", "w");
const DOTNET_OPTIONS: Record<string, OptionStringBuilder> = {
    RUN: RUN_OPTION,
    WATCH: WATCH_OPTION,
};

// #endregion Constants

// -----------------------------------------------------------------------------------------
// #region Variables
// -----------------------------------------------------------------------------------------

let _clean: boolean = false;
let _option: OptionStringBuilder = DOTNET_OPTIONS.RUN;
let _restore: boolean = false;

// #endregion Variables

// -----------------------------------------------------------------------------------------
// #region Functions
// -----------------------------------------------------------------------------------------

const Dotnet = {
    cmd(option: OptionStringBuilder = DOTNET_OPTIONS.RUN): string {
        const runCommand =
            option === DOTNET_OPTIONS.WATCH ? "watch run" : "run";
        return `dotnet ${runCommand} --no-restore`;
    },
    description(option: OptionStringBuilder = DOTNET_OPTIONS.RUN) {
        const webProjectFilePath =
            DotnetPath.webProjectFilePath() ?? "<web project path>";
        const command = this.cmd(option);
        return `Runs the dotnet project (via ${command}) for ${webProjectFilePath}`;
    },
    getOptions() {
        return DOTNET_OPTIONS;
    },
    run() {
        // Verify that the solution path exists or exit early.
        DotnetPath.solutionPathOrExit();

        if (_clean) {
            DotnetClean.run();
        }

        if (_restore) {
            DotnetRestore.run();
        }

        Dir.pushd(DotnetPath.webProjectFileDir()!);

        const command = this.cmd(_option);
        Echo.message(`Running dotnet (via ${this.cmd(_option)})...`);
        Process.spawn(command.toString());

        Dir.popd();
    },
    setClean(clean: boolean = false) {
        if (clean != null) {
            _clean = clean;
        }
        return this;
    },
    setOption(option: OptionStringBuilder = DOTNET_OPTIONS.RUN) {
        if (option != null) {
            _option = option;
        }
        return this;
    },
    setRestore(restore: boolean = false) {
        if (restore != null) {
            _restore = restore;
        }
        return this;
    },
};

// #endregion Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { Dotnet };

// #endregion Exports
