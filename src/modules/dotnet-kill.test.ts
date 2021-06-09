import { DotnetKill } from "./dotnet-kill";
import faker from "faker";
import { Process } from "./process";
import { TestUtils } from "../tests/test-utils";
import { ProcessDescriptor } from "ps-list";
import { Factory } from "rosie";
import { FactoryType } from "../tests/factories/factory-type";

// -----------------------------------------------------------------------------------------
// #region Tests
// -----------------------------------------------------------------------------------------

describe("DotnetKill", () => {
    // -----------------------------------------------------------------------------------------
    // #region run
    // -----------------------------------------------------------------------------------------

    describe("run", () => {
        let shellExitSpy: jest.SpyInstance;
        beforeEach(() => {
            shellExitSpy = TestUtils.spyOnShellExit();
        });

        test(`when '${DotnetKill.cmd()}' fails, it calls shell.exit`, async () => {
            // Arrange
            const status = faker.random.number({ min: 1 });
            const spawnSyncSpy = TestUtils.spyOnSpawnSync({ status });

            // Act
            await DotnetKill.run();

            // Assert
            expect(spawnSyncSpy).toHaveBeenCalled();
            expect(shellExitSpy).toHaveBeenCalledWith(status);
        });

        test("when no dotnet process ids are found, it returns true", async () => {
            // Arrange
            const psListSpy = jest.spyOn(Process, "list").mockResolvedValue([]);

            // Act
            const result = await DotnetKill.run();

            // Assert
            expect(psListSpy).toHaveBeenCalled();
            expect(result).toBeTrue();
        });

        test("when dotnet process ids are found, it calls ps.kill", async () => {
            // Arrange
            const processes = Factory.buildList<ProcessDescriptor>(
                FactoryType.ProcessDescriptor,
                2
            );
            const psKillSpy = jest.spyOn(Process, "kill").mockImplementation();
            jest.spyOn(Process, "list").mockResolvedValue(processes);

            // Act
            await DotnetKill.run();

            // Assert
            expect(psKillSpy).toHaveBeenCalledWith(processes.map((e) => e.pid));
        });
    });

    // #endregion run
});

// #endregion Tests
