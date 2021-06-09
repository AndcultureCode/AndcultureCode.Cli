import { CollectionUtils, StringUtils } from "andculturecode-javascript-core";
import { Echo } from "../modules/echo";
import shell from "shelljs";

// -----------------------------------------------------------------------------------------
// #region Public Functions
// -----------------------------------------------------------------------------------------
/**
 * @deprecated Use `Process.spawn` instead. This function allows you to pass a command string
 * (including args) directly instead of separating them. This class will be removed in a future release.
 */
class CommandStringBuilder {
    // -----------------------------------------------------------------------------------------
    // #region Public Members
    // -----------------------------------------------------------------------------------------

    public args: string[];
    public cmd: string;

    // #endregion Public Members

    // -----------------------------------------------------------------------------------------
    // #region Constructor
    // -----------------------------------------------------------------------------------------

    /**
     * Constructor function to return a `CommandString` object based on the given command & arguments
     *
     * @param {string} [cmd=""] Base command to be executed, ie `dotnet`
     * @param {string[]} [args=[]] Any additional arguments that need to be passed along with the
     * base command, such as `build`
     * @returns {CommandStringBuilder}
     */
    constructor(cmd: string = "", ...args: string[]) {
        this.cmd = cmd;
        this.args = _sanitizeArgs(args);
    }

    // #endregion Constructor

    // -----------------------------------------------------------------------------------------
    // #region Public Functions
    // -----------------------------------------------------------------------------------------

    public toString(): string {
        _validateOrExit(this.cmd);
        return _buildString(this.cmd, this.args);
    }

    public withArgs(...args: string[]): CommandStringBuilder {
        this.args = _sanitizeArgs(args);
        return this;
    }

    public withCmd(cmd: string = ""): CommandStringBuilder {
        this.cmd = cmd;
        return this;
    }

    // #endregion Public Functions
}

// #endregion Public Functions

// -----------------------------------------------------------------------------------------
// #region Private Functions
// -----------------------------------------------------------------------------------------

const _buildString = (cmd: string = "", args: string[] = []) => {
    let fullCommandString = cmd;

    // Only append a space with the concatenated array of args if it contains a value
    // Some commands do not require any additional arguments.
    if (
        CollectionUtils.hasValues(args) &&
        StringUtils.hasValue(args.join(" "))
    ) {
        fullCommandString = `${fullCommandString} ${args.join(" ")}`;
    }

    return fullCommandString;
};

const _sanitizeArgs = (args: Array<string | undefined> = []): string[] => {
    if (CollectionUtils.isEmpty(args)) {
        return [];
    }

    return args
        .filter((arg: string | undefined) => StringUtils.hasValue(arg))
        .map((arg: string | undefined) => arg!);
};

const _validateOrExit = (cmd: string = "") => {
    if (StringUtils.hasValue(cmd)) {
        return;
    }

    Echo.error("Command is required");
    shell.exit(1);
};

// #endregion Private Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { CommandStringBuilder };

// #endregion Exports
