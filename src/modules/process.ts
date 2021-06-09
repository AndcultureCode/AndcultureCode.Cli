import { Echo } from "./echo";
import fkill from "fkill";
import psList, { ProcessDescriptor } from "ps-list";
import shell from "shelljs";
import { KillOptions } from "../interfaces/kill-options";
import { ProcessResult } from "../interfaces/process-result";
import child_process, {
    SpawnSyncOptions,
    SpawnSyncReturns,
} from "child_process";
import { StringUtils } from "andculturecode-javascript-core";
import { SpawnOptions } from "../interfaces/spawn-options";
import { SpawnIOMode } from "../enums/spawn-io-mode";

// -----------------------------------------------------------------------------------------
// #region Constants
// -----------------------------------------------------------------------------------------

const _defaultKillOptions: KillOptions = {
    force: true,
    ignoreCase: true,
    silent: true,
    tree: true,
};

const _defaultSpawnOptions: SpawnOptions = {
    exitOnError: true,
    stdio: SpawnIOMode.Inherit,
    shell: true,
};

const ERROR_COMMAND_REQUIRED = "Command is required";

// #endregion Constants

// -----------------------------------------------------------------------------------------
// #region Public Functions
// -----------------------------------------------------------------------------------------

const Process = {
    DEFAULT_KILL_OPTIONS: _defaultKillOptions,
    DEFAULT_SPAWN_OPTIONS: _defaultSpawnOptions,
    async kill(
        input: number | string | ReadonlyArray<string | number>,
        options: KillOptions = _defaultKillOptions
    ): Promise<void> {
        try {
            await fkill(input, options);
        } catch (error) {
            Echo.error(
                `There was an error killing processes ${input}: ${error}`
            );
            shell.exit(1);
        }
    },
    async list(name?: string): Promise<ProcessDescriptor[]> {
        let processes: ProcessDescriptor[] = [];
        try {
            processes = await psList();
        } catch (error) {
            Echo.error(
                `There was an error retrieving the process list: ${error}`
            );
            shell.exit(1);
        }

        if (name != null) {
            processes = processes.filter((process: ProcessDescriptor) =>
                process.name.match(name)
            );
        }

        return processes;
    },
    spawn(commandAndArgs: string, options?: SpawnOptions): ProcessResult {
        options = Object.assign(_defaultSpawnOptions, options);

        const { exitOnError } = options;
        const { command, args } = _parseCommandAndArgs(commandAndArgs);

        const result = _mapToProcessResult(
            child_process.spawnSync(command, args, {
                stdio: options.stdio,
                shell: options.shell,
            })
        );

        if (result.code === 0) {
            return result;
        }

        const message =
            options.onError?.(result) ??
            `'${commandAndArgs}' failed with status ${result.code}: ${result.stderr}`;
        Echo.error(message);

        if (!exitOnError) {
            return result;
        }

        shell.exit(result.code);
    },
};

// #endregion Public Functions

// -----------------------------------------------------------------------------------------
// #region Private Functions
// -----------------------------------------------------------------------------------------

const _mapToProcessResult = (
    spawnReturn: SpawnSyncReturns<Buffer>
): ProcessResult => ({
    code: spawnReturn.status ?? 1,
    stderr: spawnReturn.stderr?.toString() ?? "",
    stdout: spawnReturn.stdout?.toString() ?? "",
});

const _parseCommandAndArgs = (
    commandAndArgs: string
): { args: string[]; command: string } => {
    const args = commandAndArgs.split(" ");
    const command = args.shift();
    if (StringUtils.isEmpty(command)) {
        throw new Error(ERROR_COMMAND_REQUIRED);
    }

    return { args, command };
};

// #endregion Private Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { Process };

// #endregion Exports
