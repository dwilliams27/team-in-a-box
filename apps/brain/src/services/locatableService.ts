import chalk from "chalk";
import { ServiceLocator } from "./serviceLocator";

export class LocatableService {
  serviceLocator: ServiceLocator;
  serviceName: string;

  constructor(serviceLocator: ServiceLocator, serviceName: string) {
    this.serviceLocator = serviceLocator;
    this.serviceName = serviceName;
    this.serviceLocator.addService<unknown>({
      serviceKey: serviceName,
      serviceValue: this,
    });
    console.log(`${chalk.green('Created LocatableService: ')}${chalk.yellow(serviceName)}`);
  }

  log(messages: string | string[], data?: (string | undefined | null)[]) {
    console.log(`${chalk.green(this.serviceName)}\n${Array.isArray(messages) ? messages.map((message, i) => {
        if (data && data.length > i) {
          return `- ${chalk.yellow(message)}: ${chalk.blueBright(data[i])}`;
        }
        return chalk.yellow(message);
      }).join('\n') : chalk.yellow(messages)}
    `);
  }
}
