import { Echo } from "./echo";
import { Process } from "./process";

// -----------------------------------------------------------------------------------------
// #region Constants
// -----------------------------------------------------------------------------------------

const AZCOPY_COMMAND = "azcopy sync";

// #endregion Constants

// -----------------------------------------------------------------------------------------
// #region Interfaces
// -----------------------------------------------------------------------------------------

/**
 * Represents the different parts necessary to build an Azure Blob URL
 */
interface BlobStorageUrlParts {
    /**
     * The unique blob storage account name
     */
    account: string;
    /**
     * The container within the blob storage account
     */
    container: string;
    /**
     * The path to any blob within the blob storage container
     */
    path?: string;
    /**
     * The secure access signature (SAS) token necessary to authenticate access to the Blob URL
     */
    sasToken?: string;
}

/**
 * Represents the options available when using the localFile() function
 */
interface SyncLocalFileOptions {
    /**
     * The destination Blob URL parts necessary to build out the location of where to put the local file
     */
    destination: BlobStorageUrlParts;
    /**
     * The local file path to a blob to be used when syncing to the destination
     */
    localFilePath: string;
}

/**
 * Represents the options available when using the containers()
 */
interface SyncContainersOptions {
    deleteDestination: boolean;
    destination: BlobStorageUrlParts;
    recursive: boolean;
    source: BlobStorageUrlParts;
}

// #endregion Interfaces

// -----------------------------------------------------------------------------------------
// #region Public Functions
// -----------------------------------------------------------------------------------------

const AzcopySync = {
    /**
     * Syncs a local file from the calling machine to the provided destination blob storage container
     *
     * @param options Options bag with all available parameters
     */
    localFile(options: SyncLocalFileOptions) {
        const destination = _getBlobStorageUrl(options.destination);
        const flags = [_getRecursiveFlag(false)];
        const action = `syncing blob from local file path of ${options.localFilePath} to blob storage URL of ${destination}`;
        _sync(options.localFilePath, destination, action, flags);
    },

    /**
     * Syncs the provided source container with the provided destination container
     *
     * @param options Options bag with all available parameters
     */
    containers(options: SyncContainersOptions) {
        const source = _getBlobStorageUrl(options.source);
        const destination = _getBlobStorageUrl(options.destination);
        const flags = [
            _getRecursiveFlag(options.recursive),
            _getDeleteDestinationFlag(options.deleteDestination),
        ];
        const action = `syncing blobs from blob storage URL of ${source} to blob storage URL of ${destination}`;
        _sync(source, destination, action, flags);
    },
};

// #endregion Public Functions

// -----------------------------------------------------------------------------------------
// #region Private Functions
// -----------------------------------------------------------------------------------------

const _getCommandString = (
    source: string,
    destination: string,
    flags: string[]
): string => `${AZCOPY_COMMAND} ${source} ${destination} ${flags.join(" ")}`;

const _getBlobStorageUrl = (urlParts: BlobStorageUrlParts) => {
    const path = urlParts.path ?? "";
    const sasToken = urlParts.sasToken ?? "";
    return `"https://${urlParts.account}.blob.core.windows.net/${urlParts.container}/${path}${sasToken}"`;
};

const _getDeleteDestinationFlag = (deleteDestination: boolean) => {
    return `--delete-destination=${deleteDestination}`;
};

const _getRecursiveFlag = (recursive: boolean) => {
    return `--recursive=${recursive}`;
};

const _sync = (
    source: string,
    destination: string,
    action: string,
    flags: string[]
) => {
    const command = _getCommandString(source, destination, flags);

    Echo.message(`Starting the action of ${action}`);

    Process.spawn(command, {
        onError: () => `Failed when performing the action of ${action}`,
    });

    Echo.success(`Succeeded when performing the action of ${action}`);
};

// #endregion Private Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export {
    AzcopySync,
    BlobStorageUrlParts,
    SyncContainersOptions,
    SyncLocalFileOptions,
};

// #endregion Exports
