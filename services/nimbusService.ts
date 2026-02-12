import { ReplicationStatus, ReplicationState, RunningState, PerformanceConfig, BinlogPosition, MySqlSourceConfig, NimbusConnection, QueryResult } from '../types';

// The service now acts as a client-side wrapper for our Next.js API
class NimbusService {
  private activeId: string | null = null;
  private STORAGE_KEY_ACTIVE = 'nimbus_active_id_v2';

  constructor() {
    if (typeof window !== 'undefined') {
      this.activeId = localStorage.getItem(this.STORAGE_KEY_ACTIVE);
    }
  }

  // --- API Helpers ---

  private async apiCall(endpoint: string, method: string = 'GET', body?: any) {
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'API request failed');
    }
    return data;
  }

  private async runSql(sql: string): Promise<QueryResult> {
    if (!this.activeId) throw new Error("No active connection selected");
    return this.apiCall('/api/query', 'POST', {
      connectionId: this.activeId,
      sql
    });
  }

  // --- Connection Management ---

  async getConnections(): Promise<NimbusConnection[]> {
    return this.apiCall('/api/connections');
  }

  async saveConnection(conn: NimbusConnection): Promise<void> {
    await this.apiCall('/api/connections', 'POST', conn);
  }

  async deleteConnection(id: string): Promise<void> {
    await this.apiCall(`/api/connections?id=${id}`, 'DELETE');
    if (this.activeId === id) {
      this.activeId = null;
      localStorage.removeItem(this.STORAGE_KEY_ACTIVE);
    }
  }

  getActiveId(): string | null {
    return this.activeId;
  }

  async setActiveId(id: string): Promise<void> {
    this.activeId = id;
    localStorage.setItem(this.STORAGE_KEY_ACTIVE, id);
    // Simple ping to verify connection
    await this.runSql('SELECT 1'); 
  }

  getActiveConnection(): NimbusConnection | undefined {
    // This is synchronous in UI but we need to fetch list to know details.
    // For now we assume the UI calls getConnections() and finds the matching ID.
    // This method is less useful now, UI should handle state.
    // Returning undefined to force UI to look it up from its list.
    return undefined; 
  }

  // --- Replication ---

  async getReplicationStatus(): Promise<ReplicationStatus> {
    // Execute: SHOW NIMBUS REPLICATION
    const result = await this.runSql('SHOW NIMBUS REPLICATION');
    const row = result.rows[0];
    
    if (!row) throw new Error("Failed to retrieve replication status");

    return {
      full_replication: row.full_replication as ReplicationState,
      incremental_replication: row.incremental_replication as ReplicationState,
      full_running: row.full_running as RunningState,
      incremental_running: row.incremental_running as RunningState,
    };
  }

  async setFullReplication(enable: boolean): Promise<void> {
    const val = enable ? 'ON' : 'OFF';
    await this.runSql(`SET NIMBUS FULL_REPLICATION = ${val}`);
  }

  async setIncrementalReplication(enable: boolean): Promise<void> {
    const val = enable ? 'ON' : 'OFF';
    await this.runSql(`SET NIMBUS INCREMENTAL_REPLICATION = ${val}`);
  }

  // --- Performance ---

  async getPerformanceConfig(): Promise<PerformanceConfig> {
    // Execute: SHOW NIMBUS PERFORMANCE
    const result = await this.runSql('SHOW NIMBUS PERFORMANCE');
    const row = result.rows[0];
    
    if (!row) throw new Error("Failed to retrieve performance config");

    return {
      binlog_batch_size: Number(row.binlog_batch_size),
      fetch_batch_size: Number(row.fetch_batch_size),
      flush_interval_ms: Number(row.flush_interval_ms),
    };
  }

  async updatePerformanceConfig(key: keyof PerformanceConfig, value: number): Promise<void> {
    const sqlKey = key.toUpperCase(); // e.g. BINLOG_BATCH_SIZE
    await this.runSql(`SET NIMBUS ${sqlKey} = ${value}`);
  }

  // --- Binlog ---

  async getBinlogPosition(): Promise<BinlogPosition> {
    // Execute: SHOW NIMBUS BINLOG
    const result = await this.runSql('SHOW NIMBUS BINLOG');
    const row = result.rows[0];

    if (!row) throw new Error("Failed to retrieve binlog position");

    return {
      file: row.file,
      position: Number(row.position),
      server_id: Number(row.server_id),
      timestamp: row.timestamp
    };
  }

  async setBinlogPosition(file: string, position: number): Promise<void> {
    // SET NIMBUS BINLOG_POSITION = 'file' pos
    await this.runSql(`SET NIMBUS BINLOG_POSITION = '${file}' ${position}`);
  }

  // --- Source ---

  async getSourceConfig(): Promise<MySqlSourceConfig> {
    // Execute: SHOW NIMBUS MYSQL
    const result = await this.runSql('SHOW NIMBUS MYSQL');
    const row = result.rows[0];

    if (!row) throw new Error("Failed to retrieve mysql source config");

    return {
      mysql_host: row.mysql_host,
      mysql_port: Number(row.mysql_port),
      mysql_user: row.mysql_user,
      // Password is usually masked or not returned by SHOW commands for security, 
      // but let's assume it returns what the protocol sends
      mysql_password: row.mysql_password, 
      mysql_server_id: Number(row.mysql_server_id),
    };
  }

  async updateSourceConfig(config: Partial<MySqlSourceConfig>): Promise<void> {
    // Generates multiple SET commands
    if (config.mysql_host) await this.runSql(`SET NIMBUS MYSQL_HOST = '${config.mysql_host}'`);
    if (config.mysql_port) await this.runSql(`SET NIMBUS MYSQL_PORT = ${config.mysql_port}`);
    if (config.mysql_user) await this.runSql(`SET NIMBUS MYSQL_USER = '${config.mysql_user}'`);
    if (config.mysql_password) await this.runSql(`SET NIMBUS MYSQL_PASSWORD = '${config.mysql_password}'`);
    if (config.mysql_server_id) await this.runSql(`SET NIMBUS MYSQL_SERVER_ID = ${config.mysql_server_id}`);
  }

  // --- Included DBs ---

  async getIncludedDbs(): Promise<string> {
    // Execute: SHOW NIMBUS INCLUDED_DBS
    const result = await this.runSql('SHOW NIMBUS INCLUDED_DBS');
    // Assuming returns a column named 'included_dbs' or similar, or just the first column
    const row = result.rows[0];
    if (!row) return "";
    return Object.values(row)[0] as string || "";
  }

  async setIncludedDbs(dbs: string): Promise<void> {
    await this.runSql(`SET NIMBUS INCLUDED_DBS = '${dbs}'`);
  }

  // --- SQL Execution ---

  async executeQuery(sql: string): Promise<QueryResult> {
    return this.runSql(sql);
  }
}

export const nimbusService = new NimbusService();