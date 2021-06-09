import { SpawnIOMode } from "../enums/spawn-io-mode";
import { ProcessResult } from "./process-result";
import { CommonSpawnOptions } from "child_process";

// -----------------------------------------------------------------------------------------
// #region Interfaces
// -----------------------------------------------------------------------------------------

interface SpawnOptions extends Pick<CommonSpawnOptions, "shell"> {
    /**
     * Should the process terminate on a non-zero code?
     */
    exitOnError?: boolean;

    /**
     * Callback to be executed after a non-zero code is returned from the process.
     */
    onError?: (result: ProcessResult) => string;

    /**
     * Strategy for attaching stdio streams to the process
     */
    stdio?: SpawnIOMode;
}

// #endregion Interfaces

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { SpawnOptions };

// #endregion Exports
