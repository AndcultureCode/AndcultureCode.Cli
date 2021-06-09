import { TestUtils } from "../tests/test-utils";
import {
    AzcopySync,
    BlobStorageUrlParts,
    SyncContainersOptions,
    SyncLocalFileOptions,
} from "./azcopy-sync";
import faker from "faker";

// -----------------------------------------------------------------------------------------
// #region Variables
// -----------------------------------------------------------------------------------------

let command = "azcopy";
let spawnSyncArgs = { shell: true, stdio: "inherit" };

// endregion Variables

// -----------------------------------------------------------------------------------------
// #region Functions
// -----------------------------------------------------------------------------------------

const _getBlobStorageUrl = (urlParts: BlobStorageUrlParts) => {
    const path = urlParts.path ?? "";
    const sasToken = urlParts.sasToken ?? "";
    return `"https://${urlParts.account}.blob.core.windows.net/${urlParts.container}/${path}${sasToken}"`;
};

// endregion Functions

// -----------------------------------------------------------------------------------------
// #region Tests
// -----------------------------------------------------------------------------------------

describe("AzcopySync", () => {
    let spawnSyncSpy: jest.SpyInstance;
    let shellExitSpy: jest.SpyInstance;

    beforeEach(() => {
        spawnSyncSpy = TestUtils.spyOnSpawnSync();
        shellExitSpy = TestUtils.spyOnShellExit();
    });

    // -----------------------------------------------------------------------------------------
    // #region localFile
    // -----------------------------------------------------------------------------------------

    describe("localFile", () => {
        const getExpectedCommandArgs = () => [
            "sync",
            "c:/something/awesome/text.txt",
            '"https://test_account.blob.core.windows.net/test_container/test_path?test_sas_token=test"',
            "--recursive=false",
        ];
        let localFileOptions: SyncLocalFileOptions;

        beforeEach(() => {
            localFileOptions = {
                destination: {
                    account: "test_account",
                    container: "test_container",
                    path: "test_path",
                    sasToken: "?test_sas_token=test",
                },
                localFilePath: "c:/something/awesome/text.txt",
            };
        });

        test("when localFilePath provided then used as the source path argument", () => {
            // Arrange
            localFileOptions.localFilePath = "c:/some/other/directory";
            const expectedCommandArgs = getExpectedCommandArgs();
            expectedCommandArgs[1] = localFileOptions.localFilePath;

            // Act
            AzcopySync.localFile(localFileOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                expectedCommandArgs,
                spawnSyncArgs
            );
        });

        test("when destination.account provided then used in the destination URL argument", () => {
            // Arrange
            localFileOptions.destination.account = "other_test_account";
            const expectedCommandArgs = getExpectedCommandArgs();
            expectedCommandArgs[2] = _getBlobStorageUrl(
                localFileOptions.destination
            );

            // Act
            AzcopySync.localFile(localFileOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                expectedCommandArgs,
                spawnSyncArgs
            );
        });

        test("when destination.container provided then used in the destination URL argument", () => {
            // Arrange
            localFileOptions.destination.container = "other_test_container";
            const expectedCommandArgs = getExpectedCommandArgs();
            expectedCommandArgs[2] = _getBlobStorageUrl(
                localFileOptions.destination
            );

            // Act
            AzcopySync.localFile(localFileOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                expectedCommandArgs,
                spawnSyncArgs
            );
        });

        test("when destination.path provided then used in the destination URL argument", () => {
            // Arrange
            localFileOptions.destination.path = "other_test_account";
            const expectedCommandArgs = getExpectedCommandArgs();
            expectedCommandArgs[2] = _getBlobStorageUrl(
                localFileOptions.destination
            );

            // Act
            AzcopySync.localFile(localFileOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                expectedCommandArgs,
                spawnSyncArgs
            );
        });

        test("when destination.path not provided then not used in the destination URL argument", () => {
            // Arrange
            delete localFileOptions.destination.path;
            const expectedCommandArgs = getExpectedCommandArgs();
            expectedCommandArgs[2] = _getBlobStorageUrl(
                localFileOptions.destination
            );

            // Act
            AzcopySync.localFile(localFileOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                expectedCommandArgs,
                spawnSyncArgs
            );
        });

        test("when destination.sasToken provided then used in the destination URL argument", () => {
            // Arrange
            localFileOptions.destination.sasToken = "other_test_sas_token";
            const expectedCommandArgs = getExpectedCommandArgs();
            expectedCommandArgs[2] = _getBlobStorageUrl(
                localFileOptions.destination
            );

            // Act
            AzcopySync.localFile(localFileOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                expectedCommandArgs,
                spawnSyncArgs
            );
        });

        test("when destination.sasToken not provided then not used in the destination URL argument", () => {
            // Arrange
            delete localFileOptions.destination.sasToken;
            const expectedCommandArgs = getExpectedCommandArgs();
            expectedCommandArgs[2] = _getBlobStorageUrl(
                localFileOptions.destination
            );

            // Act
            AzcopySync.localFile(localFileOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                expectedCommandArgs,
                spawnSyncArgs
            );
        });

        test(`when fails then it calls shell.exit`, async () => {
            // Arrange
            const status = faker.random.number({ min: 1 });
            const spawnSyncSpy = TestUtils.spyOnSpawnSync({ status });

            // Act
            await AzcopySync.localFile(localFileOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalled();
            expect(shellExitSpy).toHaveBeenCalledWith(status);
        });
    });

    // #endregion localFile

    // -----------------------------------------------------------------------------------------
    // #region containers
    // -----------------------------------------------------------------------------------------

    describe("containers", () => {
        let containersOptions: SyncContainersOptions;
        const getExpectedCommandArgs = () => [
            "sync",
            '"https://source_test_account.blob.core.windows.net/source_test_container/source_test_path?source_test_sas_token=test"',
            '"https://destination_test_account.blob.core.windows.net/destination_test_container/destination_test_path?destination_test_sas_token=test"',
            "--recursive=false",
            "--delete-destination=false",
        ];

        beforeEach(() => {
            containersOptions = {
                deleteDestination: false,
                destination: {
                    account: "destination_test_account",
                    container: "destination_test_container",
                    path: "destination_test_path",
                    sasToken: "?destination_test_sas_token=test",
                },
                recursive: false,
                source: {
                    account: "source_test_account",
                    container: "source_test_container",
                    path: "source_test_path",
                    sasToken: "?source_test_sas_token=test",
                },
            };
        });

        test("when deleteDestination provided then used as the 5th argument", () => {
            // Arrange
            containersOptions.deleteDestination = true;
            const expectedCommandArgs = getExpectedCommandArgs();
            expectedCommandArgs[4] = "--delete-destination=true";

            // Act
            AzcopySync.containers(containersOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                expectedCommandArgs,
                spawnSyncArgs
            );
        });

        test("when destination.account provided then used in the destination URL argument", () => {
            // Arrange
            containersOptions.destination.account =
                "other_destination_test_account";
            const expectedCommandArgs = getExpectedCommandArgs();
            expectedCommandArgs[2] = _getBlobStorageUrl(
                containersOptions.destination
            );

            // Act
            AzcopySync.containers(containersOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                expectedCommandArgs,
                spawnSyncArgs
            );
        });

        test("when destination.container provided then used in the destination URL argument", () => {
            // Arrange
            containersOptions.destination.container =
                "other_destination_test_container";
            const expectedCommandArgs = getExpectedCommandArgs();
            expectedCommandArgs[2] = _getBlobStorageUrl(
                containersOptions.destination
            );

            // Act
            AzcopySync.containers(containersOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                expectedCommandArgs,
                spawnSyncArgs
            );
        });

        test("when destination.path provided then used in the destination URL argument", () => {
            // Arrange
            containersOptions.destination.path =
                "other_destination_test_account";
            const expectedCommandArgs = getExpectedCommandArgs();
            expectedCommandArgs[2] = _getBlobStorageUrl(
                containersOptions.destination
            );

            // Act
            AzcopySync.containers(containersOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                expectedCommandArgs,
                spawnSyncArgs
            );
        });

        test("when destination.sasToken provided then used in the destination URL argument", () => {
            // Arrange
            containersOptions.destination.sasToken =
                "other_destination_test_sas_token";
            const expectedCommandArgs = getExpectedCommandArgs();
            expectedCommandArgs[2] = _getBlobStorageUrl(
                containersOptions.destination
            );

            // Act
            AzcopySync.containers(containersOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                expectedCommandArgs,
                spawnSyncArgs
            );
        });

        test("when recursive provided then used as the 4th argument", () => {
            // Arrange
            containersOptions.recursive = true;
            const expectedCommandArgs = getExpectedCommandArgs();
            expectedCommandArgs[3] = "--recursive=true";

            // Act
            AzcopySync.containers(containersOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                expectedCommandArgs,
                spawnSyncArgs
            );
        });

        test("when source.account provided then used in the source URL argument", () => {
            // Arrange
            containersOptions.source.account = "other_source_test_account";
            const expectedCommandArgs = getExpectedCommandArgs();
            expectedCommandArgs[1] = _getBlobStorageUrl(
                containersOptions.source
            );

            // Act
            AzcopySync.containers(containersOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                expectedCommandArgs,
                spawnSyncArgs
            );
        });

        test("when source.container provided then used in the source URL argument", () => {
            // Arrange
            containersOptions.source.container = "other_source_test_container";
            const expectedCommandArgs = getExpectedCommandArgs();
            expectedCommandArgs[1] = _getBlobStorageUrl(
                containersOptions.source
            );

            // Act
            AzcopySync.containers(containersOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                expectedCommandArgs,
                spawnSyncArgs
            );
        });

        test("when source.path provided then used in the source URL argument", () => {
            // Arrange
            containersOptions.source.path = "other_source_test_account";
            const expectedCommandArgs = getExpectedCommandArgs();
            expectedCommandArgs[1] = _getBlobStorageUrl(
                containersOptions.source
            );

            // Act
            AzcopySync.containers(containersOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                expectedCommandArgs,
                spawnSyncArgs
            );
        });

        test("when source.path not provided then not used in the source URL argument", () => {
            // Arrange
            delete containersOptions.source.path;
            const expectedCommandArgs = getExpectedCommandArgs();
            expectedCommandArgs[1] = _getBlobStorageUrl(
                containersOptions.source
            );

            // Act
            AzcopySync.containers(containersOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                expectedCommandArgs,
                spawnSyncArgs
            );
        });

        test("when source.sasToken provided then used in the source URL argument", () => {
            // Arrange
            containersOptions.source.sasToken = "other_source_test_sas_token";
            const expectedCommandArgs = getExpectedCommandArgs();
            expectedCommandArgs[1] = _getBlobStorageUrl(
                containersOptions.source
            );

            // Act
            AzcopySync.containers(containersOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                expectedCommandArgs,
                spawnSyncArgs
            );
        });

        test("when source.sasToken not provided then not used in the source URL argument", () => {
            // Arrange
            delete containersOptions.source.sasToken;
            const expectedCommandArgs = getExpectedCommandArgs();
            expectedCommandArgs[1] = _getBlobStorageUrl(
                containersOptions.source
            );

            // Act
            AzcopySync.containers(containersOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                expectedCommandArgs,
                spawnSyncArgs
            );
        });

        test(`when fails then it calls shell.exit`, async () => {
            // Arrange
            const status = faker.random.number({ min: 1 });
            const spawnSyncSpy = TestUtils.spyOnSpawnSync({ status });

            // Act
            await AzcopySync.containers(containersOptions);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalled();
            expect(shellExitSpy).toHaveBeenCalledWith(status);
        });
    });

    // #endregion containers
});

// #endregion Tests
