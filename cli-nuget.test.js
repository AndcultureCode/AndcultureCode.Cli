// -----------------------------------------------------------------------------------------
// #region Imports
// -----------------------------------------------------------------------------------------

const { HELP_OPTIONS } = require("./_modules/constants");
const testUtils        = require("./tests/test-utils");

// #endregion Imports

// -----------------------------------------------------------------------------------------
// #region Tests
// -----------------------------------------------------------------------------------------

describe("cli-nuget", () => {
    // -----------------------------------------------------------------------------------------
    // #region -h, --help
    // -----------------------------------------------------------------------------------------

    describe(HELP_OPTIONS, () => {
        test.each`
            option
            ${"-h"}
            ${"--help"}
        `("when passed '$option', it displays the help menu", async ({ option }) => {
            // Arrange & Act
            const result = await testUtils.executeCliCommand("nuget", [option]);

            // Assert
            expect(result).toContain(HELP_OPTIONS);
        });
    });

    // #endregion -h, --help
});

// #endregion Tests
