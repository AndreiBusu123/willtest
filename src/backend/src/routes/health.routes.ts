import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/database.service';
import { logger } from '../utils/logger';
import os from 'os';

const router = Router();

// Basic health check
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Detailed health check
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const healthChecks = {
      api: 'healthy',
      database: 'unknown',
      memory: 'unknown',
      cpu: 'unknown',
    };

    // Check database connection
    try {
      const result = await DatabaseService.query('SELECT NOW()');
      healthChecks.database = result.rows.length > 0 ? 'healthy' : 'unhealthy';
    } catch (error) {
      healthChecks.database = 'unhealthy';
      logger.error('Database health check failed:', error);
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryPercentage = ((totalMemory - freeMemory) / totalMemory) * 100;
    
    healthChecks.memory = memoryPercentage < 90 ? 'healthy' : 'warning';

    // Check CPU usage
    const cpus = os.cpus();
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;
    
    healthChecks.cpu = cpuUsage < 80 ? 'healthy' : 'warning';

    // Overall status
    const overallStatus = Object.values(healthChecks).includes('unhealthy') 
      ? 'unhealthy' 
      : Object.values(healthChecks).includes('warning')
      ? 'degraded'
      : 'healthy';

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 207 : 503;

    res.status(statusCode).json({
      status: overallStatus,
      checks: healthChecks,
      metrics: {
        uptime: process.uptime(),
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: memoryPercentage.toFixed(2),
        },
        cpu: {
          usage: cpuUsage.toFixed(2),
          cores: cpus.length,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Readiness check (for Kubernetes/Docker)
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if database is ready
    await DatabaseService.query('SELECT 1');
    
    res.json({
      ready: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
    });
  }
});

// Liveness check (for Kubernetes/Docker)
router.get('/live', (req: Request, res: Response) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
  });
});

export default router;