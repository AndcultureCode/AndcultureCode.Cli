import { CommandDefinitions } from "./modules/command-definitions";
import {
    givenOptions,
    shouldDisplayError,
    shouldDisplayHelpMenu,
    withTemporaryDirectory,
} from "./tests/shared-specs";
import { DotnetPath } from "./modules/dotnet-path";
import { TestUtils } from "./tests/test-utils";
import { DotnetBuild } from "./modules/dotnet-build";
import { DotnetPublish } from "./modules/dotnet-publish";
import shell from "shelljs";

// -----------------------------------------------------------------------------------------
// #region Constants
// -----------------------------------------------------------------------------------------

const COMMAND = CommandDefinitions.dotnet.command;
const REGEX_BUILD_COMPLETED = /(Build (succeeded|FAILED))/;
const REGEX_BUILD_FAILED = /(Build FAILED)/;
const REGEX_PUBLISH_COMPLETED = new RegExp(
    `(${DotnetPublish.ERROR_PUBLISH_FAILED}|${DotnetPublish.PUBLISH_SUCCESS})`
);

// #endregion Constants

// -----------------------------------------------------------------------------------------
// #region Tests
// -----------------------------------------------------------------------------------------

describe("and-cli-dotnet", () => {
    // -----------------------------------------------------------------------------------------
    // #region Setup
    // -----------------------------------------------------------------------------------------

    withTemporaryDirectory(COMMAND, () => {
        DotnetPath.verifyOrExit();
    });

    // #endregion Setup

    // -----------------------------------------------------------------------------------------
    // #region build
    // -----------------------------------------------------------------------------------------

    givenOptions(DotnetBuild.getOptions().toArray(), (option: string) => {
        describe("when no solution can be found", () =>
            shouldDisplayError(
                async () =>
                    // Arrange & Act
                    await TestUtils.executeCliCommand(COMMAND, [option])
            ));

        describe("when solution exists", () => {
            test("it performs a build", async () => {
                // Arrange
                TestUtils.createDotnetSolution();
                TestUtils.createDotnetConsoleApp();
                TestUtils.addDotnetProject();

                // Act
                const result = await TestUtils.executeCliCommand(COMMAND, [
                    option,
                ]);

                // Assert
                expect(result).toMatch(REGEX_BUILD_COMPLETED);
            });

            describe("given solution does not build", () => {
                test("it displays an error", async () => {
                    // Arrange
                    TestUtils.createDotnetSolution();
                    TestUtils.createDotnetConsoleApp();
                    TestUtils.addDotnetProject();
                    const programFile = TestUtils.findProgramCs();

                    shell.echo(";").to(programFile); // <-- Force a compile error

                    const result = await TestUtils.executeCliCommand(COMMAND, [
                        option,
                    ]);

                    // Assert
                    expect(result).toMatch(REGEX_BUILD_FAILED);
                });
            });
        });
    });

    // #endregion build

    // -----------------------------------------------------------------------------------------
    // #region help
    // -----------------------------------------------------------------------------------------

    shouldDisplayHelpMenu("dotnet");

    // #endregion help

    // -----------------------------------------------------------------------------------------
    // #region publish
    // -----------------------------------------------------------------------------------------

    givenOptions(DotnetPublish.getOptions().toArray(), (option: string) => {
        describe("when no solution can be found", () =>
            shouldDisplayError(
                async () =>
                    // Arrange & Act
                    await TestUtils.executeCliCommand(COMMAND, [option])
            ));

        describe("when solution exists", () => {
            test("it performs a build", async () => {
                // Arrange
                TestUtils.createDotnetSolution();
                TestUtils.createDotnetConsoleApp();
                TestUtils.addDotnetProject();

                // Act
                const result = await TestUtils.executeCliCommand(COMMAND, [
                    option,
                ]);

                // Assert
                expect(result).toMatch(REGEX_PUBLISH_COMPLETED);
            });

            describe("given solution does not build", () => {
                test("it displays an error", async () => {
                    // Arrange
                    TestUtils.createDotnetSolution();
                    TestUtils.createDotnetConsoleApp();
                    TestUtils.addDotnetProject();
                    const programFile = TestUtils.findProgramCs();

                    shell.echo(";").to(programFile); // <-- Force a compile error

                    const result = await TestUtils.executeCliCommand(COMMAND, [
                        option,
                    ]);

                    // Assert
                    expect(result).toContain(
                        DotnetPublish.ERROR_PUBLISH_FAILED
                    );
                });
            });
        });
    });

    // #endregion publish
});

// #endregion Tests
