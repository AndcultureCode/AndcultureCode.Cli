import { shouldDisplayHelpMenu } from "./tests/shared-specs";

// -----------------------------------------------------------------------------------------
// #region Tests
// -----------------------------------------------------------------------------------------

describe("and-cli-webpack", () => {
    // -----------------------------------------------------------------------------------------
    // #region help
    // -----------------------------------------------------------------------------------------

    shouldDisplayHelpMenu("webpack");

    // #endregion help
});

// #endregion Tests
