import { ReplicationStatus, ReplicationState, RunningState, PerformanceConfig, BinlogPosition, MySqlSourceConfig, NimbusConnection, QueryResult, User, AuthResponse } from '../types';

class NimbusService {
  private activeId: string | null = null;
  private token: string | null = null;
  private user: User | null = null;

  private STORAGE_KEY_ACTIVE = 'nimbus_active_id_v2';
  private STORAGE_KEY_TOKEN = 'nimbus_auth_token';
  private STORAGE_KEY_USER = 'nimbus_auth_user';

  constructor() {
    if (typeof window !== 'undefined') {
      this.activeId = localStorage.getItem(this.STORAGE_KEY_ACTIVE);
      this.token = localStorage.getItem(this.STORAGE_KEY_TOKEN);
      const userStr = localStorage.getItem(this.STORAGE_KEY_USER);
      if (userStr) {
        try { this.user = JSON.parse(userStr); } catch(e) {}
      }
    }
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  getCurrentUser(): User | null {
    return this.user;
  }

  async login(username: string, password: string): Promise<void> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '登录失败');

    this.token = data.token;
    this.user = data.user;
    localStorage.setItem(this.STORAGE_KEY_TOKEN, data.token);
    localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(data.user));
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem(this.STORAGE_KEY_TOKEN);
    localStorage.removeItem(this.STORAGE_KEY_USER);
    window.location.reload();
  }

  // --- API Helpers ---

  private async apiCall(endpoint: string, method: string = 'GET', body?: any) {
    const headers: any = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(endpoint, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (res.status === 401) {
      this.logout();
      throw new Error("会话已过期，请重新登录");
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'API request failed');
    }
    return data;
  }

  // --- User Management ---
  
  async getUsers(): Promise<User[]> {
    return this.apiCall('/api/auth/user');
  }

  async createUser(username: string, password: string): Promise<void> {
    await this.apiCall('/api/auth/user', 'POST', { username, password });
  }

  async updateUser(id: number, username: string, password?: string): Promise<void> {
    await this.apiCall('/api/auth/user', 'PUT', { id, username, password });
  }

  async deleteUser(id: number): Promise<void> {
    await this.apiCall(`/api/auth/user?id=${id}`, 'DELETE');
    // If we deleted ourselves, logout
    if (this.user && this.user.id === id) {
      this.logout();
    }
  }

  // Kept for compatibility if used elsewhere, but redirected to updateUser
  async changePassword(password: string, targetUserId?: number): Promise<void> {
    const id = targetUserId || this.user?.id;
    const username = this.user?.username || 'unknown'; // This might fail if we don't know the username of targetUserId.
    // Ideally we shouldn't use this legacy method anymore in new UI.
    // For now throwing error if used improperly.
    if (!id) throw new Error("User ID required");
    // We actually need the username for the UPDATE query in DB helper usually, 
    // OR we fix the DB helper to not require username if only password changes. 
    // But since we have a new UI, let's assume this method is deprecated.
    throw new Error("Please use updateUser instead");
  }

  // --- Existing Logic ---

  private async runSql(sql: string, database?: string): Promise<QueryResult> {
    if (!this.activeId) throw new Error("No active connection selected");
    return this.apiCall('/api/query', 'POST', {
      connectionId: this.activeId,
      sql,
      database // Optional: pass the current DB context
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
    await this.runSql('SELECT 1'); 
  }

  // --- Replication ---

  async getReplicationStatus(): Promise<ReplicationStatus> {
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
    const sqlKey = key.toUpperCase();
    await this.runSql(`SET NIMBUS ${sqlKey} = ${value}`);
  }

  // --- Binlog ---

  async getBinlogPosition(): Promise<BinlogPosition> {
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
    await this.runSql(`SET NIMBUS BINLOG_POSITION = '${file}' ${position}`);
  }

  // --- Source ---

  async getSourceConfig(): Promise<MySqlSourceConfig> {
    const result = await this.runSql('SHOW NIMBUS MYSQL');
    const row = result.rows[0];
    if (!row) throw new Error("Failed to retrieve mysql source config");
    return {
      mysql_host: row.mysql_host,
      mysql_port: Number(row.mysql_port),
      mysql_user: row.mysql_user,
      mysql_password: row.mysql_password, 
      mysql_server_id: Number(row.mysql_server_id),
    };
  }

  async updateSourceConfig(config: Partial<MySqlSourceConfig>): Promise<void> {
    if (config.mysql_host) await this.runSql(`SET NIMBUS MYSQL_HOST = '${config.mysql_host}'`);
    if (config.mysql_port) await this.runSql(`SET NIMBUS MYSQL_PORT = ${config.mysql_port}`);
    if (config.mysql_user) await this.runSql(`SET NIMBUS MYSQL_USER = '${config.mysql_user}'`);
    if (config.mysql_password) await this.runSql(`SET NIMBUS MYSQL_PASSWORD = '${config.mysql_password}'`);
    if (config.mysql_server_id) await this.runSql(`SET NIMBUS MYSQL_SERVER_ID = ${config.mysql_server_id}`);
  }
  
  async testSourceConnection(config: Partial<MySqlSourceConfig>): Promise<void> {
    // Map MySqlSourceConfig keys to the /api/test endpoint expectations
    await this.apiCall('/api/test', 'POST', {
      host: config.mysql_host,
      port: config.mysql_port,
      user: config.mysql_user,
      password: config.mysql_password,
    });
  }

  // --- Included DBs ---

  async getIncludedDbs(): Promise<string> {
    const result = await this.runSql('SHOW NIMBUS INCLUDED_DBS');
    const row = result.rows[0];
    if (!row) return "";
    return Object.values(row)[0] as string || "";
  }

  async setIncludedDbs(dbs: string): Promise<void> {
    await this.runSql(`SET NIMBUS INCLUDED_DBS = '${dbs}'`);
  }

  // --- Schema Sync ---

  async getSchemaSync(): Promise<boolean> {
    try {
      const result = await this.runSql('SHOW NIMBUS SCHEMA_SYNC');
      const row = result.rows[0];
      if (!row) return true; // Default
      const val = Object.values(row)[0] as string; 
      return val === 'ON';
    } catch (e) {
      console.warn("Failed to get schema sync status, defaulting to true", e);
      return true;
    }
  }

  async setSchemaSync(enable: boolean): Promise<void> {
    const val = enable ? 'ON' : 'OFF';
    await this.runSql(`SET NIMBUS SYNC_SCHEMA = ${val}`);
  }

  // --- SQL Execution ---

  async executeQuery(sql: string, database?: string): Promise<QueryResult> {
    return this.runSql(sql, database);
  }
}

export const nimbusService = new NimbusService();