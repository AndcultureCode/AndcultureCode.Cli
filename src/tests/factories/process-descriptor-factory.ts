import { Factory } from "rosie";
import { FactoryType } from "./factory-type";
import { TestUtils } from "../test-utils";
import { ProcessDescriptor } from "ps-list";

// -------------------------------------------------------------------------------------------------
// #region Factory
// -------------------------------------------------------------------------------------------------

const ProcessDescriptorFactory = Factory.define<ProcessDescriptor>(
    FactoryType.ProcessDescriptor
).attrs({
    name: TestUtils.randomWord(),
    pid: TestUtils.randomNumber(),
});

// #endregion Factory

// -------------------------------------------------------------------------------------------------
// #region Exports
// -------------------------------------------------------------------------------------------------

export { ProcessDescriptorFactory };

// #endregion Exports
