import { Echo } from "./echo";
import fs from "fs";
import shell, { ExecOutputReturnValue } from "shelljs";
import { StringUtils } from "andculturecode-javascript-core";
import { Process } from "./process";
import { ProcessResult } from "../interfaces/process-result";

// -----------------------------------------------------------------------------------------
// #region Public Members
// -----------------------------------------------------------------------------------------

const Git = {
    /**
     * Configures a new remote when run in root of git repository
     * @param {string} name local identifier for a new remote
     * @param {string} url absolute url corresponding to remote destination
     */
    addRemote(name: string, url: string) {
        if (!this.isRepositoryRoot()) {
            Echo.error(
                `Cannot add remote '${name}'. Current directory '${shell.pwd()} is not the root of a git repository.`
            );
            return false;
        }

        const command = `git remote add ${name} ${url}`;
        const { code } = Process.spawn(command, { exitOnError: false });
        return code === 0;
    },

    /**
     * Clone a git repository
     * @param {string} name Name of repository being cloned
     * @param {string} url Absolute HTTPS or SSH repository URL
     * @param {string} prefix Prefix for destination folder '{FOLDER_PREFIX}.{REPOSITORY_NAME}'
     */
    clone(name: string, url: string, prefix?: string) {
        if (StringUtils.isEmpty(name)) {
            return false;
        }

        if (StringUtils.isEmpty(url)) {
            return false;
        }

        const folder = this.getCloneDirectoryName(name, prefix);

        const { code } = Process.spawn(`git clone ${url} ${folder}`, {
            exitOnError: false,
            onError: (result: ProcessResult) =>
                `Failed to clone '${name}' - ${result.stderr}`,
        });

        return code === 0;
    },

    /**
     * Constructs target folder name given a repo and optional prefix
     * @param {string} repoName short name of repository
     * @param {string} prefix optional prefix
     */
    getCloneDirectoryName(repoName: string, prefix?: string) {
        if (StringUtils.isEmpty(repoName)) {
            return "";
        }

        return StringUtils.hasValue(prefix)
            ? `${prefix}.${repoName}`
            : repoName;
    },

    /**
     * Checks if the repository is cloned for the supplied combination
     * @param {string} repoName short name of repository
     * @param {string} prefix optional prefix
     */
    isCloned(repoName: string, prefix?: string) {
        const folder = Git.getCloneDirectoryName(repoName, prefix);
        return fs.existsSync(folder);
    },

    /**
     * Verifies if we are in a git repo
     */
    isRepositoryRoot(): boolean {
        // not verifying integrity at this time
        // consider `git rev-parse --is-inside-work-tree at a future time
        return fs.existsSync(".git");
    },

    /**
     * Opens the supplied URL in the system's default browser
     * @param {string} url absolute url
     */
    openWebBrowser(url: string) {
        Process.spawn(`git web--browse ${url}`);
    },
};

// #endregion Public Members

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

export { Git };

// #endregion Exports
