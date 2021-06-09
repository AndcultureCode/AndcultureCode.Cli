import shell from "shelljs";
import { OptionStringBuilder } from "../utilities/option-string-builder";
import { Echo } from "./echo";
import { Options } from "../constants/options";
import { Process } from "./process";

// -----------------------------------------------------------------------------------------
// #region Functions
// -----------------------------------------------------------------------------------------

const NodeRestore = {
    cmd(): string {
        return "npm install";
    },
    description() {
        return `Restore npm dependencies (via ${this.cmd()}) in the current directory`;
    },
    getOptions(): OptionStringBuilder {
        return Options.Restore;
    },
    run() {
        const command = this.cmd();
        Echo.message(
            `Restoring npm packages (via ${command}) in ${shell.pwd()}...`
        );

        Process.spawn(command);

        Echo.success("npm packages restored");
    },
};

// #endregion Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { NodeRestore };

// #endregion Exports
