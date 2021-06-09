import { Echo } from "./echo";
import { Process } from "./process";
import { OptionStringBuilder } from "../utilities/option-string-builder";
import { ProcessDescriptor } from "ps-list";
import { CollectionUtils } from "andculturecode-javascript-core";

// -----------------------------------------------------------------------------------------
// #region Functions
// -----------------------------------------------------------------------------------------

const DotnetKill = {
    cmd(): string {
        return "dotnet build-server shutdown";
    },
    description() {
        return "Forcefully kills any running dotnet processes (see https://github.com/dotnet/cli/issues/1327)";
    },
    getOptions(): OptionStringBuilder {
        return new OptionStringBuilder("kill", "k");
    },
    async run() {
        const command = this.cmd();

        Echo.error(`Stopping dotnet build servers via (${command})...`);

        Process.spawn(command, {
            onError: (result) =>
                `There was an error shutting down the MSBuild server: ${result.code} ${result.stderr}`,
        });

        Echo.success("Finished shutting down build servers");

        // Manually gathering process ID list and filtering results vs. just deferring to fkill
        // with a string - something with the regex pattern they are using is invalid in node v8
        const psListResult = await Process.list("dotnet");

        const dotnetPids = psListResult.map((e: ProcessDescriptor) => e.pid);
        if (CollectionUtils.isEmpty(dotnetPids)) {
            Echo.message("No dotnet PIDs found!");
            return true;
        }

        Echo.message(`Force killing dotnet PIDs ${dotnetPids}...`);

        await Process.kill(dotnetPids);

        Echo.message("Finished force killing lingering dotnet processes.");
        return true;
    },
};

// #endregion Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { DotnetKill };

// #endregion Exports
