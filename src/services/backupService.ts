import { AuthService } from './authService';
import { ClassService } from './classService';
import { StudentService } from './studentService';
import { AttendanceService } from './attendanceService';
import { GradeService } from './gradeService';
import { AgendaService } from './agendaService';
import { SavingsService } from './savingsService';
import { Storage } from '../utils/storage';

export interface FullBackupPayload {
  version: string;
  exportedAt: string;
  source: 'Supabase-AbsenApp';
  teacher: any;
  classes: any[];
  students: any[];
  sessions: any[];
  grades: any[];
  agendas: any[];
  savings: any[];
}

export const BackupService = {
  /**
   * Export all teacher data into a downloadable JSON backup
   */
  async exportFullBackup(teacherId: string): Promise<FullBackupPayload> {
    const [profile, classes, students, sessions, grades, agendas, savings] = await Promise.all([
      AuthService.getProfile(teacherId) || Storage.getTeacher(),
      ClassService.listClasses(teacherId),
      StudentService.listAllStudents(),
      AttendanceService.listAttendanceSessions(teacherId),
      GradeService.listGrades(),
      AgendaService.listAgendas(teacherId),
      SavingsService.listSavings(teacherId),
    ]);

    const backup: FullBackupPayload = {
      version: '2.0.0-supabase',
      exportedAt: new Date().toISOString(),
      source: 'Supabase-AbsenApp',
      teacher: profile,
      classes: classes.length ? classes : Storage.getClasses(),
      students: students.length ? students : Storage.getAllStudents(),
      sessions: sessions.length ? sessions : Storage.getAllSessions(),
      grades: grades.length ? grades : Storage.getAllGrades(),
      agendas: agendas.length ? agendas : Storage.getAllAgendas(),
      savings: savings.length ? savings : Storage.getAllSavings(),
    };

    return backup;
  },

  /**
   * Trigger download of backup JSON file in browser
   */
  downloadBackupFile(backup: FullBackupPayload): void {
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_absenapp_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Restore full backup data into Supabase
   */
  async restoreBackupToSupabase(teacherId: string, backupData: FullBackupPayload): Promise<{ success: boolean; message: string }> {
    try {
      if (backupData.teacher) {
        await AuthService.updateProfile(teacherId, backupData.teacher);
      }
      if (backupData.classes && backupData.classes.length) {
        await ClassService.saveClassesBatch(teacherId, backupData.classes);
      }
      if (backupData.students && backupData.students.length) {
        await StudentService.saveStudentsBatch(backupData.students);
      }
      if (backupData.sessions && backupData.sessions.length) {
        await AttendanceService.saveAttendanceSessionsBatch(teacherId, backupData.sessions);
      }
      if (backupData.grades && backupData.grades.length) {
        await GradeService.saveGradesBatch(backupData.grades);
      }
      if (backupData.agendas && backupData.agendas.length) {
        await AgendaService.saveAgendasBatch(teacherId, backupData.agendas);
      }
      if (backupData.savings && backupData.savings.length) {
        await SavingsService.saveSavingsBatch(teacherId, backupData.savings);
      }

      return { success: true, message: 'Data backup berhasil dipulihkan ke Supabase.' };
    } catch (err: any) {
      console.error('[BackupService] restore error:', err);
      return { success: false, message: err.message || 'Gagal memulihkan data backup.' };
    }
  },
};
