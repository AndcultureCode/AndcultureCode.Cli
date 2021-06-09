import { StringUtils } from "andculturecode-javascript-core";
import child_process, { SpawnSyncReturns } from "child_process";
import upath from "upath";
import faker from "faker";
import concat from "concat-stream";
import { Constants } from "../modules/constants";
import { TestUtils as AndcultureCodeTestUtils } from "andculturecode-javascript-testing";
import { Formatters } from "../modules/formatters";
import shell from "shelljs";

// -----------------------------------------------------------------------------------------
// #region Mocks
// -----------------------------------------------------------------------------------------

// For most cases, we want to use the manual mock of the child_process module. However,
// in this context, we will be executing the CLI itself, so we need to use the real implementation
// of child_process.
jest.unmock("child_process");

// #endregion Mocks

// -----------------------------------------------------------------------------------------
// #region Public Functions
// -----------------------------------------------------------------------------------------

const TestUtils = {
    ...AndcultureCodeTestUtils,
    /**
     * Adds one or more dotnet projects to the solution in the current directory based on the given
     * path. Defaults to \*\*\/*.csproj which will adds all projects in the current directory to the solution.
     *
     * @param {string} path Path pattern to add dotnet projects from.
     */
    addDotnetProject(path?: string) {
        if (StringUtils.isEmpty(path)) {
            path = upath.join(shell.pwd().toString(), "**", "*.csproj");
        }

        const matchingPaths = shell.ls(path!);
        TestUtils.executeOrThrow("dotnet", ["sln", "add", ...matchingPaths]);
    },
    /**
     * Creates and enters a temporary working directory. Returns the directory name as well as
     * a cleanup function for resetting the working directory and removing created dir/files.
     *
     * @param {string} [prefix="tmp"] (Optional) Prefix for the directory name to be generated.
     */
    createAndUseTmpDir(prefix: string = "") {
        const defaultPrefix = "tmp";
        const oldPwd = shell.pwd().toString();
        const tmpDir = upath.join(
            oldPwd,
            `${defaultPrefix}-${prefix}-${faker.random.uuid()}`
        );

        shell.mkdir("-p", tmpDir);
        shell.cd(tmpDir);

        const cleanupTmpDir = () => {
            shell.cd(oldPwd);
            shell.rm("-rf", tmpDir);
        };

        return { cleanupTmpDir, tmpDir };
    },
    /**
     * Uses the dotnet cli to creates a new dotnet solution in the current directory. If no name is
     * provided, it uses the name of the current directory as the solution name.
     *
     * @param {string} [name=""]
     */
    createDotnetSolution(name = "") {
        _executeDotnetNew("solution", name);
    },
    /**
     * Uses the dotnet cli to creates a new dotnet console app in the current directory. If no name is
     * provided, it uses the name of the current directory as the project name.
     *
     * @param {string} [name=""]
     */
    createDotnetConsoleApp(name = "") {
        _executeDotnetNew("console", name);
    },
    /**
     * Uses the dotnet cli to creates a new XUnit project in the current directory. If no name is
     * provided, it uses the name of the current directory as the project name.
     *
     * @param {string} [name=""]
     */
    createDotnetXUnitProject(name = "") {
        _executeDotnetNew("xunit", name);
    },
    /**
     * Wrapper around `child_process.spawn` that passes in the main executable, `and-cli.js`, as the process path.
     * This allows you to pass just the command you're testing in as the first argument.
     *
     * @example
     * const result = await TestUtils.executeCliCommand("dotnet", ["--help"]);
     * @param {string} command
     * @param {string[]} args
     * @param {object} opts
     */
    executeCliCommand(command?: string, args: string[] = [], opts: any = {}) {
        const cliEntrypointPath = upath.join(
            __dirname,
            "..",
            "..",
            Constants.DIST,
            Constants.ENTRYPOINT
        );
        if (command != null) {
            args = [command, ...args];
        }
        return _executeNode(cliEntrypointPath, args, opts);
    },
    /**
     * Calls `child_process.spawnSync()` with the given args or options. If the process fails,
     * it will throw a fatal error to prevent further execution. Useful for arrangement steps
     * that require setting up data for the system under test.
     *
     * @param {string} processPath
     * @param {string[]} [args=[]]
     * @param {object} [opts={}]
     */
    executeOrThrow(processPath: string, args: string[] = [], opts: any = {}) {
        jest.spyOn(child_process, "spawnSync").mockRestore();
        const { status } = child_process.spawnSync(processPath, args, opts);
        if (status !== 0) {
            _throwFatalError(
                `'${processPath} ${args.join(
                    " "
                )}' failed with exit code: ${status}`
            );
        }
    },

    /**
     * Find the first `Program.cs` under the current directory.
     */
    findProgramCs(): string | never {
        const programCs = shell.find("**/*/Program.cs")[0];
        if (programCs != null) {
            return programCs;
        }

        return _throwFatalError(
            `Could not locate Program.cs in ${shell.pwd()}`
        );
    },

    /**
     * Helper to easily check if tests run in continuous integration environment
     */
    isCI() {
        return process.env["CI"] === "true";
    },

    /**
     * Helper to easily check if tests run outside of continuous integration environment
     */
    isNotCI() {
        return !TestUtils.isCI();
    },

    /**
     * Helper to mock shell response
     * @param {number} code response code from shell command
     * @param {*} stdout
     */
    mockShellFunction(code = 0, stdout = "") {
        return jest.fn().mockReturnValue({ code, stdout });
    },

    /**
     * Wrapper of faker.random.number
     *
     * @param {number} [min=Number.MIN_SAFE_INTEGER] Minimum number value to randomly generate
     * @param {number} [max=Number.MAX_SAFE_INTEGER] Maximum number value to randomly generate
     */
    randomNumber(min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
        const number = faker.random.number({ min, max });
        return number;
    },

    /**
     * Returns a Jest spy instance of the mocked `shell.exit` method
     */
    spyOnShellExit() {
        return jest.spyOn(shell, "exit").mockImplementation();
    },

    /**
     *  Returns a Jest spy instance of the mocked `child_process.spawnSync` method
     */
    spyOnSpawnSync(returnValue?: Partial<SpawnSyncReturns<Buffer>>) {
        const {
            status = 0,
            stderr = Buffer.from(""),
            stdout = Buffer.from(""),
        } = returnValue ?? {};
        return jest.spyOn(child_process, "spawnSync").mockReturnValue({
            output: [],
            pid: 0,
            signal: "SIGTERM",
            status,
            stderr,
            stdout,
        });
    },
};

// #endregion Public Functions

// -----------------------------------------------------------------------------------------
// #region Private Functions
// -----------------------------------------------------------------------------------------

const _createNodeProcess = (
    processPath: string,
    args: string[] = [],
    env: any = null
) => {
    args = [processPath].concat(args);

    // Use shelljs to locate the absolute path to our node executable. If it cannot be found,
    // we have bigger issues. Immediately throw an error so the test does not continue.
    const nodePath = shell.which("node");
    if (nodePath == null) {
        _throwFatalError(
            `Could not locate node executable to spawn processes. Check your environment path.`
        );
    }

    return child_process.spawn(nodePath.toString(), args, {
        env: Object.assign(process.env, env),
    });
};

/**
 * Wrapper around the `dotnet` CLI for scaffolding out new solutions/projects.
 *
 * @param {string} type Type of the dotnet project to be created, such as `solution`, `console`, `xunit`, etc.
 * @param {string} [name=""]
 */
const _executeDotnetNew = (type: string, name: string = "") => {
    // Base arguments for creating the project
    const args = ["new", type];
    if (StringUtils.hasValue(name)) {
        args.push("--name", name);
    }
    TestUtils.executeOrThrow("dotnet", args);
};

/**
 * The setup of this Node spawn wrapper is heavily based on this article:
 * https://medium.com/@zorrodg/integration-tests-on-node-js-cli-part-1-why-and-how-fa5b1ba552fe
 *
 * It allows for us to call synchronous or asynchronous parent-level commands and test the layer
 * that glues our modules together.
 *
 * Wrapper around `child_process.spawn()` that creates a child node process to execute the given
 * process path, returning a promise that can be awaited.
 *
 * @param {string} processPath
 * @param {string[]} args
 * @param {object} opts
 * @returns
 */
const _executeNode = (
    processPath: string,
    args: string[] = [],
    opts: any = {}
): Promise<string> => {
    jest.spyOn(child_process, "spawn").mockRestore();
    const { env = null } = opts;
    const childProcess = _createNodeProcess(processPath, args, env);
    childProcess.stdin.setDefaultEncoding("utf-8");

    return new Promise((resolve, reject) => {
        childProcess.stderr.once("data", (err: any) => {
            reject(err.toString());
        });

        childProcess.on("error", reject);

        childProcess.stdout.pipe(
            concat((result: any) => {
                resolve(result.toString());
            })
        );
    });
};

const _throwFatalError = (message: string) => {
    throw new Error(
        `${Formatters.red(Constants.ERROR_OUTPUT_STRING)} ${message}`
    );
};

// #endregion Private Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { TestUtils };

// #endregion Exports
