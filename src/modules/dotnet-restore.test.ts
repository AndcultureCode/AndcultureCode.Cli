import { TestUtils } from "../tests/test-utils";
import { DotnetPath } from "./dotnet-path";
import { DotnetRestore } from "./dotnet-restore";

// -----------------------------------------------------------------------------------------
// #region Tests
// -----------------------------------------------------------------------------------------

describe("DotnetRestore", () => {
    let dotnetPathSpy: jest.SpyInstance;
    let shellExitSpy: jest.SpyInstance;

    beforeEach(() => {
        dotnetPathSpy = jest
            .spyOn(DotnetPath, "solutionPathOrExit")
            .mockImplementation();
        shellExitSpy = TestUtils.spyOnShellExit();
    });

    // -----------------------------------------------------------------------------------------
    // #region run
    // -----------------------------------------------------------------------------------------

    describe("run", () => {
        test("it verifies the dotnet solution can be found by calling DotnetPath module", () => {
            // Arrange & Act
            DotnetRestore.run();

            // Assert
            expect(dotnetPathSpy).toHaveBeenCalled();
        });

        test("when dotnet command returns non-zero exit code, it calls shell.exit with that code", () => {
            // Arrange
            const status = TestUtils.randomNumber(1);
            TestUtils.spyOnSpawnSync({ status });

            // Act
            DotnetRestore.run();

            // Assert
            expect(shellExitSpy).toHaveBeenCalledWith(status);
        });
    });

    // #endregion run
});

// #endregion Tests
