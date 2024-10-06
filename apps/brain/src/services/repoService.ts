import { BoxPersonaDB, GitContext } from "@box/types";
import { LocatableService } from "@brain/services/locatableService";
import { ServiceLocator } from "@brain/services/serviceLocator";
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

export interface CommandHistoryItem {
  command: string;
  result: string;
  error: string;
}

export class Workspace {
  rootPath: string;
  name: string;
  gitContext: GitContext;
  persona: BoxPersonaDB;
  shellSession: ChildProcessWithoutNullStreams | null;
  commandHistory: CommandHistoryItem[] = [];

  constructor(opts: { rootPath: string, persona: BoxPersonaDB, gitContext: GitContext }) {
    this.rootPath = opts.rootPath;
    this.name = opts.persona.id;
    this.persona = opts.persona;
    this.gitContext = opts.gitContext;
    this.shellSession = null;

    this.initializeWorkspace();
  }

  async initializeWorkspace() {
    this.shellSession = await spawn('bash', [], {
      cwd: this.rootPath,
      stdio: ['pipe', 'pipe', 'pipe']
    }) as ChildProcessWithoutNullStreams;

    await this.cloneIntoRepo();
  }

  async cloneIntoRepo() {
    await this.runCommand(`git clone ${this.gitContext.remoteUrl}`);
    await this.runCommand(`cd ${this.gitContext.projectName}`);
  }

  async changeBranch(branchName: string) {
    await this.runCommand(`git checkout ${branchName}`);
  }

  async installPackage(packageName: string) {
    await this.runCommand(`npm install ${packageName}`);
  }

  async runProjectScript(command: string) {
    const { stdout, stderr } = await this.runCommand(`npm run ${command}`);
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

  async runCommand(command: string): Promise<{ stdout: string, stderr: string }> {
    if (!this.shellSession) {
      throw new Error('Shell session not initialized');
    }

    return new Promise((resolve, reject) => {
      this.shellSession?.stdin.write(command + '\n');
      let output = {
        stdout: '',
        stderr: '',
      };
      this.shellSession?.stdout.on('data', (data) => {
        output.stdout = data.toString();
      });
      this.shellSession?.stderr.on('data', (data) => {
        output.stderr = data.toString();
      });
      this.shellSession?.stdout.on('end', () => {
        this.commandHistory.push({ command, result: output.stdout, error: output.stderr });
        resolve(output);
      });
    });
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
