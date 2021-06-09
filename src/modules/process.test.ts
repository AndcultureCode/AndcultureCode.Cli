import { Process } from "./process";
import { TestUtils } from "../tests/test-utils";
import { Factory } from "rosie";
import { FactoryType } from "../tests/factories/factory-type";
import { ProcessDescriptor } from "ps-list";
import { SpawnOptions } from "../interfaces/spawn-options";
import { Echo } from "./echo";
import { ProcessResult } from "../interfaces/process-result";

// -----------------------------------------------------------------------------------------
// #region Mocks
// -----------------------------------------------------------------------------------------

// Mocking the fkill and ps-list modules so that we can modify their behavior for testing.
// They need to be mocked before importing.
jest.mock("fkill");
jest.mock("ps-list");

// #endregion Mocks

// -----------------------------------------------------------------------------------------
// #region Tests
// -----------------------------------------------------------------------------------------

describe("Process", () => {
    let shellExitSpy: jest.SpyInstance;
    beforeEach(() => {
        shellExitSpy = TestUtils.spyOnShellExit();
    });

    // -----------------------------------------------------------------------------------------
    // #region kill
    // -----------------------------------------------------------------------------------------

    describe("kill", () => {
        test("when fkill throws an error, it calls shell.exit", async () => {
            // Arrange
            jest.requireMock("fkill").mockImplementation(() => {
                throw new Error();
            });

            // Act
            await Process.kill(TestUtils.randomNumber());

            // Assert
            expect(shellExitSpy).toHaveBeenCalledWith(1);
        });

        test("when fkill succeeds, it does not call shell.exit", async () => {
            // Arrange
            jest.requireMock("fkill").mockImplementation();
            const shellExitSpy = TestUtils.spyOnShellExit();

            // Act
            await Process.kill(TestUtils.randomNumber());

            // Assert
            expect(shellExitSpy).not.toHaveBeenCalled();
        });
    });

    // #endregion kill

    // -----------------------------------------------------------------------------------------
    // #region list
    // -----------------------------------------------------------------------------------------

    describe("list", () => {
        test("when psList throws an error, it calls shell.exit", async () => {
            // Arrange
            jest.requireMock("ps-list").mockImplementation(() => {
                throw new Error();
            });

            // Act
            await Process.list();

            // Assert
            expect(shellExitSpy).toHaveBeenCalledWith(1);
        });

        test("when psList succeeds, it returns an array of processes", async () => {
            // Arrange
            const mockProcesses = Factory.buildList(
                FactoryType.ProcessDescriptor,
                2
            );
            jest.requireMock("ps-list").mockImplementation(() => mockProcesses);

            // Act
            const result = await Process.list();

            // Assert
            expect(result).toEqual(mockProcesses);
        });

        test("when given a process name, it returns an array of processes that match", async () => {
            // Arrange
            const expectedProcess = Factory.build<ProcessDescriptor>(
                FactoryType.ProcessDescriptor
            );
            const unexpectedProcess = Factory.build<ProcessDescriptor>(
                FactoryType.ProcessDescriptor,
                {
                    name: `unexpected-${expectedProcess}`,
                }
            );
            const mockProcesses = [expectedProcess, unexpectedProcess];
            jest.requireMock("ps-list").mockImplementation(() => mockProcesses);

            // Act
            const result = await Process.list(expectedProcess.name);

            // Assert
            expect(result).toEqual([expectedProcess]);
        });
    });

    // #endregion list

    // -----------------------------------------------------------------------------------------
    // #region spawn
    // -----------------------------------------------------------------------------------------

    describe("spawn", () => {
        test.each([undefined, null, "", " "])(
            "when commandAndArgs %p, it throws",
            (commandAndArgs) => {
                expect(() => Process.spawn(commandAndArgs as string)).toThrow();
            }
        );

        test("when commandAndArgs has space separated args, it passes them to spawnSync", () => {
            // Arrange
            const command = TestUtils.randomWord();
            const args = TestUtils.randomWords();
            const spawnSyncSpy = TestUtils.spyOnSpawnSync();

            // Act
            Process.spawn([command, ...args].join(" "));

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                args,
                expect.any(Object)
            );
        });

        test("when commandAndArgs has no spaces, it passes command and empty args to spawnSync", () => {
            // Arrange
            const command = TestUtils.randomWord();
            const spawnSyncSpy = TestUtils.spyOnSpawnSync();

            // Act
            Process.spawn(command);

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalledWith(
                command,
                [],
                expect.any(Object)
            );
        });

        test.each([undefined, null])(
            "when spawnSync returns %p stdout, returns mapped stdout to empty string",
            (stdout) => {
                // Arrange
                const command = TestUtils.randomWord();
                TestUtils.spyOnSpawnSync({
                    stdout: stdout as undefined,
                });

                // Act
                const result = Process.spawn(command);

                // Assert
                expect(result.stdout).toBeEmpty();
            }
        );

        test.each([undefined, null])(
            "when spawnSync returns %p stderr, returns mapped stderr to empty string",
            (stderr) => {
                // Arrange
                const command = TestUtils.randomWord();
                TestUtils.spyOnSpawnSync({
                    stderr: stderr as undefined,
                });

                // Act
                const result = Process.spawn(command);

                // Assert
                expect(result.stderr).toBeEmpty();
            }
        );

        test("when spawnSync returns non-zero status, given onError, calls onError for custom error message", () => {
            // Arrange
            const command = TestUtils.randomWord();
            const errorMessage = TestUtils.randomWord();
            const onError = jest.fn().mockReturnValue(errorMessage);
            TestUtils.spyOnSpawnSync({ status: TestUtils.randomNumber(1) }); // <-- Ensure non-zero status is returned
            const options = Factory.build<SpawnOptions>(
                FactoryType.SpawnOptions,
                { onError }
            );
            const echoErrorSpy = jest.spyOn(Echo, "error");

            // Act
            Process.spawn(command, options);

            // Assert
            expect(onError).toHaveBeenCalled();
            expect(echoErrorSpy).toHaveBeenCalledWith(errorMessage);
        });

        // -----------------------------------------------------------------------------------------
        // #region when exitOnError false
        // -----------------------------------------------------------------------------------------

        describe("when exitOnError false", () => {
            // -----------------------------------------------------------------------------------------
            // #region Setup
            // -----------------------------------------------------------------------------------------

            const options = Factory.build<SpawnOptions>(
                FactoryType.SpawnOptions,
                { exitOnError: false }
            );

            // #endregion Setup

            test("when spawnSync returns null status, returns mapped code set to 1", () => {
                // Arrange
                const command = TestUtils.randomWord();
                // Wrapped spawnSync call should return null and default back to 1
                TestUtils.spyOnSpawnSync({ status: null });

                // Act
                const { code } = Process.spawn(command, options);

                // Assert
                expect(code).toBe(1);
            });

            test("returns mapped result", () => {
                // Arrange
                const command = TestUtils.randomWord();
                const status = TestUtils.randomNumber();
                const stderr = Buffer.from(TestUtils.randomWord());
                const stdout = Buffer.from(TestUtils.randomWord());
                TestUtils.spyOnSpawnSync({ status, stderr, stdout });

                // Act
                const result = Process.spawn(command, options);

                // Assert
                expect(result.code).toBe(status);
                expect(result.stderr).toBe(stderr.toString());
                expect(result.stdout).toBe(stdout.toString());
            });
        });

        // #endregion when exitOnError false

        // -----------------------------------------------------------------------------------------
        // #region when exitOnError true
        // -----------------------------------------------------------------------------------------

        describe("when exitOnError true", () => {
            // -----------------------------------------------------------------------------------------
            // #region Setup
            // -----------------------------------------------------------------------------------------

            const options = Factory.build<SpawnOptions>(
                FactoryType.SpawnOptions,
                { exitOnError: true }
            );

            // #endregion Setup

            test("when spawnSync returns null status, it calls shell.exit", () => {
                // Arrange
                const command = TestUtils.randomWord();
                const shellExitSpy = TestUtils.spyOnShellExit();
                TestUtils.spyOnSpawnSync({ status: null }); // <-- Wrapped spawnSync call should return null

                // Act
                Process.spawn(command, options);

                // Assert
                expect(shellExitSpy).toHaveBeenCalled();
            });

            test("when spawnSync returns non-zero status, it calls shell.exit", () => {
                // Arrange
                const command = TestUtils.randomWord();
                const status = TestUtils.randomNumber(1); // <-- Should not return 0
                const shellExitSpy = TestUtils.spyOnShellExit();
                TestUtils.spyOnSpawnSync({ status });

                // Act
                Process.spawn(command, options);

                // Assert
                expect(shellExitSpy).toHaveBeenCalled();
            });

            test("returns mapped result", () => {
                // Arrange
                const command = TestUtils.randomWord();
                const status = 0; // <-- Should return 0 or it will exit
                const stderr = Buffer.from(TestUtils.randomWord());
                const stdout = Buffer.from(TestUtils.randomWord());
                TestUtils.spyOnSpawnSync({ status, stderr, stdout });

                // Act
                const result = Process.spawn(command, options);

                // Assert
                expect(result.code).toBe(status);
                expect(result.stderr).toBe(stderr.toString());
                expect(result.stdout).toBe(stdout.toString());
            });
        });

        // #endregion when exitOnError true
    });

    // #endregion spawn
});

// #endregion Tests
