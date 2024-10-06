import chalk from "chalk";

export class ServiceLocator {
  private services: Record<string, LocatableService>;

  constructor() {
    this.services = {};
  }

  addService<T>(service: { serviceKey: string, serviceValue: any }): T {
    service.serviceValue.serviceName = service.serviceKey;
    service.serviceValue.serviceLocator = this;

    this.services[service.serviceKey] = service.serviceValue;

    return service.serviceValue;
  }

  getService<T>(name: string): T {
    if (!this.services[name]) {
      throw new Error(`Could not find service ${name}! Did you initialize it?`);
    }
    return this.services[name] as unknown as T;
  }
}

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
