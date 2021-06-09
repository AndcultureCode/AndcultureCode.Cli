import shell from "shelljs";
import { OptionStringBuilder } from "../utilities/option-string-builder";
import { Echo } from "./echo";
import { Process } from "./process";

// -----------------------------------------------------------------------------------------
// #region Functions
// -----------------------------------------------------------------------------------------

const NodeCI = {
    cmd(includeOptional: boolean = false): string {
        const command = "npm ci";
        if (includeOptional) {
            return command;
        }

        return `${command} --no-optional`;
    },
    description() {
        return `Clean and restore npm dependencies (via ${this.cmd()}) in the current directory`;
    },
    getOptions(): OptionStringBuilder {
        return new OptionStringBuilder("ci");
    },
    run(includeOptional: boolean = false) {
        Echo.message(
            `Restoring npm packages (via ${this.cmd()}) in ${shell.pwd()}...`
        );

        const command = this.cmd(includeOptional);
        Process.spawn(command);

        Echo.success("npm packages restored");
    },
};

// #endregion Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { NodeCI };

// #endregion Exports
