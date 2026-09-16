import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let adminAuthInstance: Auth | null = null;

function getFirebaseProjectId(): string {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return parsed.projectId || '';
    }
  } catch (e) {
    console.warn('Could not read firebase-applet-config.json:', e);
  }
  return process.env.FIREBASE_PROJECT_ID || 'dependable-bearing-x14dk';
}

export const getAdminAuth = (): Auth | null => {
  try {
    if (!adminAuthInstance) {
      if (!getApps().length) {
        const projectId = getFirebaseProjectId();
        if (projectId) {
          initializeApp({
            projectId,
          });
        } else {
          initializeApp();
        }
      }
      adminAuthInstance = getAuth();
    }
    return adminAuthInstance;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin Auth:', error);
    return null;
  }
};

