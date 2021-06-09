import { Options } from "fkill";

// -----------------------------------------------------------------------------------------
// #region Interfaces
// -----------------------------------------------------------------------------------------

interface KillOptions extends Options {
    /**
     * Suppress all error messages. For example: `Process doesn't exist.`
     */
    silent?: boolean;
}

// #endregion Interfaces

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { KillOptions };

// #endregion Exports
