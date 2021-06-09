import { Constants } from "./constants";
import { DotnetClean } from "./dotnet-clean";
import { DotnetPath } from "./dotnet-path";
import { TestUtils } from "../tests/test-utils";
import faker from "faker";
import shell, { ShellArray, ShellString } from "shelljs";

// -----------------------------------------------------------------------------------------
// #region Tests
// -----------------------------------------------------------------------------------------

describe("DotnetClean", () => {
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
            DotnetClean.run();

            // Assert
            expect(dotnetPathSpy).toHaveBeenCalled();
        });

        test("when no 'bin' or 'obj' directories exist, it does not call shell.rm", () => {
            // Arrange
            const shellFindSpy = jest
                .spyOn(shell, "find")
                .mockImplementation(() => ([] as any) as ShellArray);
            const shellRmSpy = jest.spyOn(shell, "rm");

            // Act
            DotnetClean.run();

            // Assert
            expect(shellFindSpy).toHaveBeenCalled();
            expect(shellRmSpy).not.toHaveBeenCalled();
        });

        test("when '.git' directory exists, it is not passed to shell.rm", () => {
            // Arrange
            const shellFindSpy = jest
                .spyOn(shell, "find")
                .mockImplementation(
                    () => [".git", Constants.BIN, Constants.OBJ] as ShellArray
                );
            const shellRmSpy = jest.spyOn(shell, "rm");

            // Act
            DotnetClean.run();

            // Assert
            expect(shellFindSpy).toHaveBeenCalled();
            expect(shellRmSpy).toHaveBeenCalledWith("-rf", [Constants.BIN]);
            expect(shellRmSpy).toHaveBeenCalledWith("-rf", [Constants.OBJ]);
        });

        test("when 'node_modules' directory exists, it is not passed to shell.rm", () => {
            // Arrange
            const shellFindSpy = jest
                .spyOn(shell, "find")
                .mockImplementation(
                    () =>
                        [
                            Constants.NODE_MODULES,
                            Constants.BIN,
                            Constants.OBJ,
                        ] as ShellArray
                );
            const shellRmSpy = jest.spyOn(shell, "rm");

            // Act
            DotnetClean.run();

            // Assert
            expect(shellFindSpy).toHaveBeenCalled();
            expect(shellRmSpy).toHaveBeenCalledWith("-rf", [Constants.BIN]);
            expect(shellRmSpy).toHaveBeenCalledWith("-rf", [Constants.OBJ]);
        });

        test(`when shell.rm fails to clean '${Constants.BIN}' directories, it calls shell.exit`, () => {
            // Arrange
            jest.spyOn(shell, "find").mockImplementation(
                () => [Constants.BIN] as ShellArray
            );
            const exitCode = faker.random.number({ min: 1 });
            const shellRmSpy = jest
                .spyOn(shell, "rm")
                .mockImplementation(() => {
                    return { code: exitCode } as ShellString;
                });

            // Act
            DotnetClean.run();

            // Assert
            expect(shellRmSpy).toHaveBeenCalled();
            expect(shellExitSpy).toHaveBeenCalledWith(exitCode);
        });

        test(`when shell.rm fails to clean '${Constants.OBJ}' directories, it calls shell.exit`, () => {
            // Arrange
            jest.spyOn(shell, "find").mockImplementation(
                () => [Constants.OBJ] as ShellArray
            );
            const exitCode = faker.random.number({ min: 1 });
            const shellRmSpy = jest
                .spyOn(shell, "rm")
                .mockImplementation(() => {
                    return { code: exitCode } as ShellString;
                });

            // Act
            DotnetClean.run();

            // Assert
            expect(shellRmSpy).toHaveBeenCalled();
            expect(shellExitSpy).toHaveBeenCalledWith(exitCode);
        });

        test(`when '${DotnetClean.cmd()}' fails, it calls shell.exit`, () => {
            // Arrange
            jest.spyOn(shell, "find").mockImplementation(
                () => ([] as any) as ShellArray
            );
            jest.spyOn(shell, "rm").mockImplementation();
            const status = TestUtils.randomNumber(1);
            const spawnSyncSpy = TestUtils.spyOnSpawnSync({ status });

            // Act
            DotnetClean.run();

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalled();
            expect(shellExitSpy).toHaveBeenCalledWith(status);
        });
    });

    // #endregion run
});

// #endregion Tests
