import { Dir } from "./dir";
import { FrontendPath } from "./frontend-path";
import { NodeClean } from "./node-clean";
import { NodeRestore } from "./node-restore";
import { Echo } from "./echo";
import { Process } from "./process";

// -----------------------------------------------------------------------------------------
// #region Public Functions
// -----------------------------------------------------------------------------------------

const Webpack = {
    cmd(): string {
        return "npm run start";
    },
    description(): string {
        return `Runs the webpack project (via ${this.cmd()}}) found in ${FrontendPath.projectDir()}`;
    },
    run(clean: boolean = false, restore: boolean = false) {
        Dir.pushd(FrontendPath.projectDir());

        const cleanWithoutRestore = clean && !restore;

        if (clean) {
            NodeClean.run();
        }

        // Webpack won't be able to start up without restoring after a clean
        if (cleanWithoutRestore) {
            return;
        }

        if (restore) {
            NodeRestore.run();
        }

        Echo.message(`Running frontend (via ${this.cmd()})...`);
        Process.spawn(this.cmd());

        Dir.popd();
    },
};

// #endregion Public Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { Webpack };

// #endregion Exports
