import { Dotnet } from "./dotnet";
import { DotnetClean } from "./dotnet-clean";
import { DotnetPath } from "./dotnet-path";
import { DotnetRestore } from "./dotnet-restore";
import faker from "faker";
import { TestUtils } from "../tests/test-utils";

// -----------------------------------------------------------------------------------------
// #region Tests
// -----------------------------------------------------------------------------------------

describe("dotnet", () => {
    let dotnetCleanSpy: jest.SpyInstance;
    let dotnetPathSpy: jest.SpyInstance;
    let dotnetRestoreSpy: jest.SpyInstance;
    let shellExitSpy: jest.SpyInstance;

    beforeEach(() => {
        dotnetCleanSpy = jest.spyOn(DotnetClean, "run").mockImplementation();
        dotnetPathSpy = jest
            .spyOn(DotnetPath, "solutionPathOrExit")
            .mockImplementation();
        dotnetRestoreSpy = jest
            .spyOn(DotnetRestore, "run")
            .mockImplementation();
        shellExitSpy = TestUtils.spyOnShellExit();
    });

    // -----------------------------------------------------------------------------------------
    // #region run
    // -----------------------------------------------------------------------------------------

    describe("run", () => {
        test("it verifies the dotnet solution can be found by calling DotnetPath module", () => {
            // Arrange & Act
            Dotnet.run();

            // Assert
            expect(dotnetPathSpy).toHaveBeenCalled();
        });

        test("when 'clean' is true, it calls DotnetClean module", () => {
            // Arrange & Act
            Dotnet.setClean(true).run();

            // Assert
            expect(dotnetCleanSpy).toHaveBeenCalled();
        });

        test("when 'restore' is true, it calls DotnetRestore module", () => {
            // Arrange & Act
            Dotnet.setRestore(true).run();

            // Assert
            expect(dotnetRestoreSpy).toHaveBeenCalled();
        });

        test("when dotnet command returns non-zero exit code, it calls shell.exit with that code", () => {
            // Arrange
            const status = TestUtils.randomNumber(1);
            const spawnSyncSpy = TestUtils.spyOnSpawnSync({ status });

            // Act
            Dotnet.run();

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalled();
            expect(shellExitSpy).toHaveBeenCalledWith(status);
        });
    });

    // #endregion run
});

// #endregion Tests
