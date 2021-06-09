import { Echo } from "./echo";
import { DotnetPath } from "./dotnet-path";
import { OptionStringBuilder } from "../utilities/option-string-builder";
import { DotnetClean } from "./dotnet-clean";
import { DotnetRestore } from "./dotnet-restore";
import { Process } from "./process";

// -----------------------------------------------------------------------------------------
// #region Functions
// -----------------------------------------------------------------------------------------

const DotnetBuild = {
    cmd(): string {
        return `dotnet build ${DotnetPath.solutionPath()} --no-restore`;
    },
    description(): string {
        return `Builds the dotnet project (via ${this.cmd()})`;
    },
    getOptions(): OptionStringBuilder {
        return new OptionStringBuilder("build", "b");
    },
    run(clean: boolean, restore: boolean) {
        // Verify that the solution path exists or exit early.
        DotnetPath.solutionPathOrExit();

        if (clean) {
            DotnetClean.run();
        }

        if (restore) {
            DotnetRestore.run();
        }

        const command = this.cmd();

        Echo.message(`Building solution (via ${command})...`);

        Process.spawn(command, {
            onError: () => "Solution failed to build. See output for details.",
        });

        return true;
    },
};

// #endregion Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { DotnetBuild };

// #endregion Exports
