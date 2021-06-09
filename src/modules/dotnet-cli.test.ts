import { DotnetBuild } from "./dotnet-build";
import { DotnetCli } from "./dotnet-cli";
import { DotnetPath } from "./dotnet-path";
import faker from "faker";
import { TestUtils } from "../tests/test-utils";

// -----------------------------------------------------------------------------------------
// #region Tests
// -----------------------------------------------------------------------------------------

describe("DotnetCli", () => {
    // -----------------------------------------------------------------------------------------
    // #region cmd
    // -----------------------------------------------------------------------------------------

    describe("cmd", () => {
        test("given a string array of arguments, it returns a properly formatted command string to the Cli path with space-separated arguments", () => {
            // Arrange
            const cliPath = TestUtils.randomFilename();
            const cliArgs = faker.random.words(3).split(" ");
            jest.spyOn(DotnetPath, "cliPath").mockImplementation(() => cliPath);
            const expectedString = `dotnet ${cliPath} ${cliArgs.join(" ")}`;

            // Act
            const result = DotnetCli.cmd(cliArgs).toString();

            // Assert
            expect(result).toBe(expectedString);
        });
    });

    // #endregion cmd

    // -----------------------------------------------------------------------------------------
    // #region run
    // -----------------------------------------------------------------------------------------

    describe("run", () => {
        let shellExitSpy: jest.SpyInstance;
        beforeEach(() => {
            shellExitSpy = TestUtils.spyOnShellExit();
        });

        test("when dotnetPath.cliPath returns undefined, it calls dotnetBuild.run", () => {
            // Arrange
            const dotnetPathSpy = jest
                .spyOn(DotnetPath, "cliPath")
                .mockImplementation(() => undefined);
            const dotnetBuildSpy = jest
                .spyOn(DotnetBuild, "run")
                .mockImplementation();

            // Act
            DotnetCli.run();

            // Assert
            expect(dotnetPathSpy).toHaveBeenCalled();
            expect(dotnetBuildSpy).toHaveBeenCalled();
        });

        test("when child_process.spawnSync returns non-zero status, it calls shell.exit with the status", () => {
            // Arrange
            const status = TestUtils.randomNumber(1);
            const spawnSync = TestUtils.spyOnSpawnSync({ status });

            // Act
            DotnetCli.run();

            // Assert
            expect(spawnSync).toHaveBeenCalled();
            expect(shellExitSpy).toHaveBeenCalledWith(status);
        });
    });

    // #endregion run
});

// #endregion Tests
