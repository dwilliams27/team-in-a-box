import { InjectableService } from "@brain/services/injectableService";
import { ServiceLocator } from "@brain/services/serviceLocator";

export const REPO_SERVICE_NAME = 'REPO_SERVICE';

export class RepoService extends InjectableService {
  constructor(serviceLocator: ServiceLocator, apiKey: string) {
    super(serviceLocator, REPO_SERVICE_NAME);
  }
}
