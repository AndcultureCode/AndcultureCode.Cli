import shell from "shelljs";
import { WebpackRestoreOptions } from "../interfaces/webpack-restore-options";
import { OptionStringBuilder } from "../utilities/option-string-builder";
import { Echo } from "./echo";
import { FrontendPath } from "./frontend-path";
import { NodeCI } from "./node-ci";
import { NodeClean } from "./node-clean";
import { NodeRestore } from "./node-restore";
import { Options } from "../constants/options";
import { Process } from "./process";
import { Dir } from "./dir";

// -----------------------------------------------------------------------------------------
// #region Functions
// -----------------------------------------------------------------------------------------

const WebpackPublish = {
    cmd(): string {
        return "npm run build";
    },
    description(): string {
        return `Publishes a release build of the frontend project (via ${this.cmd()}) in ${FrontendPath.projectDir()}`;
    },
    getOptions(): OptionStringBuilder {
        return Options.Publish;
    },
    restore(options: WebpackRestoreOptions): void {
        const ci = options.ci ?? false;
        const clean = !options.skipClean ?? true;
        const restore = !options.skipRestore ?? true;

        if (ci) {
            NodeCI.run();
            return;
        }

        if (clean) {
            NodeClean.run();
        }

        if (restore) {
            NodeRestore.run();
        }
    },
    run(options: WebpackRestoreOptions): boolean {
        _cleanPublishDir();

        Dir.pushd(FrontendPath.projectDir());

        this.restore(options);

        Echo.message(`Building frontend (via ${this.cmd()})...`);

        const command = this.cmd();
        Process.spawn(command, { onError: () => "Failed to build frontend" });

        Dir.popd();

        Echo.success("Frontend built successfully");
        return true;
    },
};

// #endregion Functions

// -----------------------------------------------------------------------------------------
// #region Private Functions
// -----------------------------------------------------------------------------------------

const _cleanPublishDir = () => {
    const publishDir = FrontendPath.publishDir();
    Echo.message(`Cleaning publish directory ${publishDir}...`);

    const { code: cleanStatus } = shell.rm("-rf", publishDir);
    if (cleanStatus !== 0) {
        Echo.error(`Failed to clean ${publishDir} dir: ${cleanStatus}`);
        shell.exit(cleanStatus);
    }

    Echo.success("Publish directory cleaned");
};

// #endregion Private Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { WebpackPublish };

// #endregion Exports
