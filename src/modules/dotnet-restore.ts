import { DotnetPath } from "./dotnet-path";
import { Echo } from "./echo";
import { OptionStringBuilder } from "../utilities/option-string-builder";
import { Options } from "../constants/options";
import { Process } from "./process";

// -----------------------------------------------------------------------------------------
// #region Functions
// -----------------------------------------------------------------------------------------

const DotnetRestore = {
    cmd(): string {
        return `dotnet restore ${DotnetPath.solutionPath()}`;
    },
    description(): string {
        return `Restore the dotnet solution from the root of the project (via ${this.cmd()})`;
    },
    getOptions(): OptionStringBuilder {
        return Options.Restore;
    },
    run(): boolean {
        // Verify that the solution path exists or exit early.
        DotnetPath.solutionPathOrExit();

        const command = this.cmd();

        Echo.message(`Restoring nuget packages (via ${this.cmd()})...`);

        Process.spawn(command, {
            onError: () =>
                "Solution failed to restore. See output for details.",
        });

        Echo.success("Dotnet solution restored");

        return true;
    },
};

// #endregion Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { DotnetRestore };

// #endregion Exports
