import { BoxPersonaDB, GitContext } from "@box/types";
import { ServiceLocator, LocatableService } from "@brain/services/serviceLocator";
import { ShellSession } from "@brain/utils/shellSession";
import child_process, { ChildProcessWithoutNullStreams } from "child_process";
import fs from "fs";
import { readdir } from "fs/promises";
import util from "util";

const exec = util.promisify(child_process.exec);
const spawn = util.promisify(child_process.spawn);

/* Proj structure
- index.js
- package.json
- package-lock.json
*/

export class Workspace {
  rootPath: string;
  name: string;
  gitContext: GitContext;
  persona: BoxPersonaDB;
  shellSession: ShellSession;

  constructor(opts: { rootPath: string, persona: BoxPersonaDB, gitContext: GitContext }) {
    this.rootPath = opts.rootPath;
    this.name = opts.persona.id;
    this.persona = opts.persona;
    this.gitContext = opts.gitContext;
    this.shellSession = new ShellSession(
      opts.rootPath,
      [`git clone ${this.gitContext.remoteUrl}`, `cd ${this.gitContext.projectName}`]
    );
  }

  async changeBranch(branchName: string) {
    await this.shellSession.runCommand(`git checkout ${branchName}`);
  }

  async installPackage(packageName: string) {
    await this.shellSession.runCommand(`npm install ${packageName}`);
  }

  async runProjectScript(command: string) {
    const { stdout, stderr } = await this.shellSession.runCommand(`npm run ${command}`);
    return { stdout, stderr };
  }

  async getPackageJson() {
    return this.readFile('package.json');
  }

  async getFilenames() {
    return await readdir('.');
  }

  async readFile(relativePath: string): Promise<string> {
    try {
      const data = await fs.promises.readFile(relativePath, 'utf8');
      console.log(data.toString());
      return data.toString();
    } catch (err) {
      console.error('Error reading file:', err);
    }

    return '';
  }

  async writeFile(content: string, relativePath: string): Promise<boolean> {
    try {
      const data = await fs.promises.writeFile(relativePath, content);
      return true;
    } catch (err) {
      console.error('Error writing file:', err);
    }

    return false;
  }
}

export const REPO_SERVICE_NAME = 'REPO_SERVICE';

export class RepoService extends LocatableService {
  workspaces: Record<string, Workspace> = {};
  
  constructor(serviceLocator: ServiceLocator) {
    super(serviceLocator, REPO_SERVICE_NAME);
  }

  registerWorkspaceForPersona(persona: BoxPersonaDB, gitContext: GitContext) {
    if (this.workspaces[persona.id]) {
      throw new Error(`Workspace already exists for ${persona.name}!`);
    }
    const workspace = new Workspace({ rootPath: `./${persona.id}`, persona, gitContext });
    this.workspaces[workspace.name] = workspace;
  }

  getWorkspaceForPersona(persona: BoxPersonaDB) {
    if (!this.workspaces[persona.id]) {
      throw new Error(`Workspace not found for ${persona.id}!`);
    }
    return this.workspaces[persona.id];
  }
}
