export type MigrationDuplicateStrategy = 'skip' | 'update' | 'cancel';

export type MigrationStatus = 'dry_run_success' | 'completed' | 'failed' | 'cancelled' | 'pending';

export interface MigrationImportRecord {
  id: string;
  admin_user_id: string;
  admin_email: string;
  file_name: string;
  started_at: string;
  completed_at?: string;
  total_records: number;
  valid_count: number;
  invalid_count: number;
  success_count: number;
  failed_count: number;
  duplicate_count: number;
  status: MigrationStatus;
  strategy: MigrationDuplicateStrategy;
  error_summary?: string;
}

export interface MigrationImportItem {
  id: string;
  import_id: string;
  entity_type: 'classes' | 'students' | 'attendance_sessions' | 'grades' | 'teaching_agendas' | 'savings' | 'teacher_profile';
  legacy_id?: string;
  target_id: string;
  name_or_title: string;
  status: 'valid' | 'duplicate' | 'imported' | 'updated' | 'skipped' | 'failed';
  error_message?: string;
  details?: string;
}

export interface EntityDryRunStats {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  missingFields: string[];
  items: Array<{
    legacy_id?: string;
    identifier: string;
    status: 'valid' | 'duplicate' | 'invalid';
    warningOrError?: string;
    data: any;
  }>;
}

export interface MigrationDryRunResult {
  isValid: boolean;
  formatDetected: 'full_backup' | 'student_array' | 'class_array' | 'session_array' | 'unknown';
  fileName: string;
  adminUserId: string;
  summary: {
    totalRecords: number;
    validCount: number;
    invalidCount: number;
    duplicateCount: number;
    missingFields: string[];
  };
  breakdown: {
    teacher: EntityDryRunStats;
    classes: EntityDryRunStats;
    students: EntityDryRunStats;
    sessions: EntityDryRunStats;
    grades: EntityDryRunStats;
    agendas: EntityDryRunStats;
    savings: EntityDryRunStats;
  };
  errors: Array<{
    entity: string;
    rowNumber?: number;
    message: string;
    dataPreview?: any;
  }>;
  payloadToImport: any;
}
