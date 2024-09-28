import { InjectableService } from "./injectableService";

export class ServiceLocator {
  private services: Record<string, InjectableService>;

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
    return this.services[name] as unknown as T;
  }
}
