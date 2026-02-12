export enum ReplicationState {
  ON = 'ON',
  OFF = 'OFF',
}

export enum RunningState {
  Running = 'Running',
  Stopped = 'Stopped',
}

export interface ReplicationStatus {
  full_replication: ReplicationState;
  incremental_replication: ReplicationState;
  full_running: RunningState;
  incremental_running: RunningState;
}

export interface PerformanceConfig {
  binlog_batch_size: number;
  fetch_batch_size: number;
  flush_interval_ms: number;
}

export interface BinlogPosition {
  file: string;
  position: number;
  server_id: number;
  timestamp: string;
}

export interface MySqlSourceConfig {
  mysql_host: string;
  mysql_port: number;
  mysql_user: string;
  mysql_password?: string; // Often hidden in UI
  mysql_server_id: number;
}

export interface QueryResult {
  columns: string[];
  rows: any[];
  duration: number;
}

export interface NimbusConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  created_at: number;
}

export type ViewState = 'dashboard' | 'sql' | 'replication' | 'performance' | 'source' | 'advanced' | 'connections';
