import shell from "shelljs";
import { ProcessResult } from "../interfaces/process-result";
import { Echo } from "./echo";
import { Process } from "./process";

// -----------------------------------------------------------------------------------------
// #region Variables
// -----------------------------------------------------------------------------------------

const pythonInstallerUrl =
    "https://www.python.org/ftp/python/3.7.4/python-3.7.4-amd64.exe";

// #endregion Variables

// -----------------------------------------------------------------------------------------
// #region Public Functions
// -----------------------------------------------------------------------------------------

const Azure = {
    validateAzCli() {
        if (!shell.which("az")) {
            Echo.message("Azure CLI not found. Attempting install via PIP...");

            if (!shell.which("pip")) {
                Echo.error(`PIP is required - ${pythonInstallerUrl}`);
                shell.exit(1);
            }

            Process.spawn("pip install azure-cli", {
                onError: () => "Failed to install azure cli via pip",
            });

            Echo.success(" - Successfully installed Azure CLI");
        }
    },
    /**
     * Executes `az login` using username/password.
     * @param {*} username Azure account username
     * @param {*} secret Azure account password
     */
    login(username: string, secret: string) {
        const loginCommand = `az login -u ${username} -p ${secret}`;
        _login(loginCommand);
    },
    /**
     * Executes `az login` using service principal.
     * @param {*} clientId Client ID for the service principal
     * @param {*} tenantId Tenant ID for the service principal
     * @param {*} secret Secret for the service principal
     */
    // @ts-expect-error ts-migrate(1117) FIXME: An object literal cannot have multiple properties ... Remove this comment to see the full error message
    login(clientId: string, tenantId: string, secret: string) {
        const loginCommand = `az login --service-principal -u ${clientId} -t ${tenantId} -p=${secret}`;
        _login(loginCommand);
    },
    /**
     * Executes `az logout` to logout of az cli.
     */
    logout() {
        const logoutCmd = "az logout";

        Process.spawn(logoutCmd, {
            onError: () =>
                " - Failed to logout from Azure, it is recommended `az logout` is run manually",
        });
    },
};

// #endregion Public Functions

// -----------------------------------------------------------------------------------------
// #region Private Functions
// -----------------------------------------------------------------------------------------

const _login = (command: string): ProcessResult =>
    Process.spawn(command, {
        onError: () => " - Failed to login to Azure",
    });

// #endregion Private Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { Azure };

// #endregion Exports
