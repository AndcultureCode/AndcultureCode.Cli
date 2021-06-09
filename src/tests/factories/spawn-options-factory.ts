import { Factory } from "rosie";
import { FactoryType } from "./factory-type";
import { SpawnOptions } from "../../interfaces/spawn-options";
import { SpawnIOMode } from "../../enums/spawn-io-mode";
import faker from "faker";

// -------------------------------------------------------------------------------------------------
// #region Factory
// -------------------------------------------------------------------------------------------------

const SpawnOptionsFactory = Factory.define<SpawnOptions>(
    FactoryType.SpawnOptions
).attrs({
    exitOnError: faker.random.boolean(),
    stdio: faker.random.arrayElement([
        SpawnIOMode.Ignore,
        SpawnIOMode.Inherit,
        SpawnIOMode.Pipe,
    ]),
});

// #endregion Factory

// -------------------------------------------------------------------------------------------------
// #region Exports
// -------------------------------------------------------------------------------------------------

export { SpawnOptionsFactory };

// #endregion Exports
