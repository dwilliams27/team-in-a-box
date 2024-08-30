import { ServiceLocator } from "./serviceLocator";

export class InjectableService {
  serviceLocator: ServiceLocator;
  serviceName: string;

  constructor(serviceLocator: ServiceLocator, serviceName: string) {
    this.serviceLocator = serviceLocator;
    this.serviceName = serviceName;
    this.serviceLocator.addService<unknown>({
      serviceKey: serviceName,
      serviceValue: this,
    });
    console.log(`Created InjectableService: ${serviceName}`);
  }
}

export class InjectableServiceInstance<T> extends InjectableService {
  service: any;

  constructor(serviceLocator: ServiceLocator, serviceName: string, service: any) {
    super(serviceLocator, serviceName);
    this.service = service;
  }
}
