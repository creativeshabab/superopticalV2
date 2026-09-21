import { Controller, Get, Inject } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Public } from '../common/decorators';

@Controller('health')
export class HealthController {
  constructor(@Inject(DatabaseService) private readonly databaseService: DatabaseService) {}

  @Public()
  @Get()
  async getHealth() {
    const dbHealth = await this.databaseService.checkHealth();
    const memory = process.memoryUsage();

    return {
      status: dbHealth.isHealthy ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: dbHealth.isHealthy ? 'CONNECTED' : 'DISCONNECTED',
        latencyMs: dbHealth.latencyMs,
        error: dbHealth.error,
      },
      system: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
      },
    };
  }
}
