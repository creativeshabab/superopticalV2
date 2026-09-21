import { Injectable, Logger, Inject } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { auditLogs, securityEvents } from '../database/schema';
import { eq, desc } from 'drizzle-orm';

export interface CreateAuditLogDto {
  tenantId?: string | null;
  storeId?: string | null;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface CreateSecurityEventDto {
  eventType: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  actorId?: string | null;
  tenantId?: string | null;
  ipAddress?: string | null;
  details?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject(DatabaseService) private readonly databaseService: DatabaseService) {}

  /**
   * Synchronously records an audit log entry for critical system and user operations.
   */
  async log(entry: CreateAuditLogDto): Promise<void> {
    const db = this.databaseService.getDb();
    try {
      await db.insert(auditLogs).values({
        tenantId: entry.tenantId ?? null,
        storeId: entry.storeId ?? null,
        userId: entry.userId ?? null,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId ?? null,
        metadata: entry.metadata ?? {},
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
      });
    } catch (err: any) {
      this.logger.error(`Failed to write audit log: ${err.message}`, err.stack);
      // In production, synchronous audit failures should not be silently swallowed if security strictness is required
    }
  }

  /**
   * Synchronously records a security event (e.g., token reuse, authentication failure, unauthorized access).
   */
  async logSecurityEvent(event: CreateSecurityEventDto): Promise<void> {
    const db = this.databaseService.getDb();
    try {
      await db.insert(securityEvents).values({
        eventType: event.eventType,
        severity: event.severity,
        actorId: event.actorId ?? null,
        tenantId: event.tenantId ?? null,
        ipAddress: event.ipAddress ?? null,
        details: event.details ?? {},
      });
      this.logger.warn(
        `[SECURITY EVENT - ${event.severity}] ${event.eventType} - Actor: ${event.actorId || 'unknown'}`
      );
    } catch (err: any) {
      this.logger.error(`Failed to write security event: ${err.message}`, err.stack);
    }
  }

  /**
   * Retrieve paginated audit logs, optionally filtered by tenant
   */
  async findLogs(options: { tenantId?: string; limit?: number; offset?: number }) {
    const db = this.databaseService.getDb();
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    let query = db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    if (options.tenantId) {
      return db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.tenantId, options.tenantId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);
    }

    return query;
  }
}
