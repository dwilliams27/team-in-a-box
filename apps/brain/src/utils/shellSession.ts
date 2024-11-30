import { ChildProcessWithoutNullStreams, spawn, exec } from "node:child_process";

export interface CommandHistoryItem {
  command: string;
  result: string;
  error: string;
}

export class ShellSession {
  rootPath: string;
  shellSession: ChildProcessWithoutNullStreams | null = null;
  commandHistory: CommandHistoryItem[] = [];

  constructor(rootPath: string, startupCommands: string[]) {
    this.rootPath = rootPath;
    this.initShell(startupCommands);
  }

  async initShell(startupCommands: string[]) {
    console.log('initializing shell');
    this.shellSession = await spawn('bash', [], {
      cwd: this.rootPath,
      stdio: ['pipe', 'pipe', 'pipe']
    }) as ChildProcessWithoutNullStreams;

    for(const command of startupCommands) {
      console.log('runnin command', command);
      const res = await this.runCommand(command);
      if (res.stderr) {
        console.error(res.stderr);
      }
      console.log(res.stdout);
      console.log('ran than mand')
    }
  }

  async runCommand(command: string): Promise<{ stdout: string, stderr: string }> {
    if (!this.shellSession) {
      throw new Error('Shell session not initialized');
    }

    return new Promise((resolve, reject) => {
      let output = {
        stdout: '',
        stderr: '',
      };
      this.shellSession?.stdout.on('data', (data) => {
        console.log('gotta dat', data.toString());
        output.stdout = data.toString();
      });
      this.shellSession?.stderr.on('data', (data) => {
        output.stderr = data.toString();
      });
      this.shellSession?.stdout.on('end', () => {
        console.log('ender')
        this.commandHistory.push({ command, result: output.stdout, error: output.stderr });
        resolve(output);
      });
      this.shellSession?.stdin.write(command + '\n');
    });
  }

  async execCommand(command: string) {
    const execPromise = new Promise((resolve) => {
      exec(command, (error) => {
        if (error) {
          console.error(error);
        }
        resolve(null);
      })
    });
    await execPromise;
  }
}
