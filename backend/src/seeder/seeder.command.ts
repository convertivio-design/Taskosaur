import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { SeederService } from './seeder.service';
import { MarketingDemoSeederService } from './marketing-demo.seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule);
  const seederService = app.get(SeederService);
  const marketingDemoSeeder = app.get(MarketingDemoSeederService);

  const command = process.argv[2] || 'seed'; // Default to 'seed' if no argument

  try {
    switch (command) {
      case 'seed':
        console.log('🚀 Starting core modules seeding (idempotent)...\n');
        await seederService.seedCoreModules();
        console.log('\n🎉 Core modules seeding completed successfully!');
        break;

      case 'admin':
        console.log('🚀 Starting admin modules seeding (idempotent)...\n');
        await seederService.adminSeedModules();
        console.log('\n🎉 Admin modules seeding completed successfully!');
        break;

      case 'clear':
        console.log('🚀 Starting core modules clearing...\n');
        await seederService.clearCoreModules();
        console.log('\n🎉 Core modules clearing completed successfully!');
        break;

      case 'reset':
        console.log('🚀 Starting core modules reset...\n');
        await seederService.clearCoreModules();
        console.log('✅ Existing data cleared\n');
        await seederService.seedCoreModules();
        console.log('\n🎉 Core modules reset completed successfully!');
        break;

      case 'marketing':
        console.log('🚀 Starting marketing demo seeding (idempotent)...\n');
        await marketingDemoSeeder.seed();
        console.log('\n🎉 Marketing demo seeding completed successfully!');
        break;

      default:
        console.log(`
🌱 Seeder Commands:

  npm run seed              - Seed core modules (idempotent - safe to run multiple times)
  npm run seed:admin        - Seed admin user only (idempotent - safe to run multiple times)
  npm run seed:clear        - Clear all core modules data
  npm run seed:reset        - Clear and re-seed core modules
  npm run seed:marketing    - Seed marketing automation demo data (idempotent)

All seed commands are idempotent and safe to run multiple times.
        `);
        break;
    }
  } catch (_error) {
    console.error('\n❌ Error:', _error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

void bootstrap();
