import { ServiceLocator } from '@brain/services';
import { MongoService } from '@brain/services/mongoService';

class App {
  db: MongoService;
  rootServiceLocator: ServiceLocator;

  constructor() {
    console.log('🧠 started');
    this.rootServiceLocator = new ServiceLocator();
    this.db = new MongoService(this.rootServiceLocator);
    this.db.connect().catch(error => {
      console.error('Failed to connect to the database:', error);
      process.exit(1);
    });
  }
}

new App();
