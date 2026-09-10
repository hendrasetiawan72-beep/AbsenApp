import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Configure Firebase app
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google Workspace Scopes
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.readonly',
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'select_account' });

// In-memory token cache (NEVER persist in localStorage per guidelines)
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;
let isSigningIn = false;

export const initGoogleWorkspaceAuth = (
  onSuccess?: (user: User, token: string) => void,
  onFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      cachedUser = user;
      if (cachedAccessToken) {
        if (onSuccess) onSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If logged in via Firebase session but token expired or cleared, user needs re-trigger
        if (onFailure) onFailure();
      }
    } else {
      cachedAccessToken = null;
      cachedUser = null;
      if (onFailure) onFailure();
    }
  });
};

export const signInWithGoogleWorkspace = async (): Promise<{
  user: User;
  accessToken: string;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Tidak dapat memperoleh Access Token dari Akun Google.');
    }
    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Workspace Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getCachedUser = (): User | null => {
  return cachedUser;
};

export const signOutGoogleWorkspace = async () => {
  await firebaseSignOut(auth);
  cachedAccessToken = null;
  cachedUser = null;
};

// -------------------------------------------------------------
// GOOGLE DRIVE API HELPERS
// -------------------------------------------------------------
export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
}

export const listDriveFiles = async (
  accessToken: string,
  query = "trashed = false and (mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/json' or name contains 'SMK Muhammadiyah')"
): Promise<DriveFileItem[]> => {
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,mimeType,webViewLink,createdTime,modifiedTime,size)&pageSize=30&orderBy=modifiedTime desc`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal mengambil daftar file Google Drive (${response.status})`);
  }

  const data = await response.json();
  return data.files || [];
};

export const uploadFileToDrive = async (
  accessToken: string,
  fileName: string,
  mimeType: string,
  content: string | Blob,
  description?: string
): Promise<DriveFileItem> => {
  const metadata = {
    name: fileName,
    mimeType: mimeType,
    description: description || 'Dibuat otomatis oleh SIM Absensi & Nilai SMK Muhammadiyah Bawang',
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );

  const fileBlob =
    typeof content === 'string'
      ? new Blob([content], { type: mimeType })
      : content;
  form.append('file', fileBlob);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal menyimpan ke Google Drive (${res.status})`);
  }

  return await res.json();
};

export const deleteDriveFile = async (
  accessToken: string,
  fileId: string
): Promise<boolean> => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal menghapus file dari Drive (${res.status})`);
  }

  return true;
};

// -------------------------------------------------------------
// GOOGLE SHEETS API HELPERS
// -------------------------------------------------------------
export interface CreateSpreadsheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

export const createGoogleSheet = async (
  accessToken: string,
  title: string,
  sheetNames: string[] = ['Rekap']
): Promise<CreateSpreadsheetResult> => {
  const body = {
    properties: {
      title,
    },
    sheets: sheetNames.map((name) => ({
      properties: {
        title: name,
        gridProperties: {
          rowCount: 200,
          columnCount: 30,
        },
      },
    })),
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal membuat Google Sheet (${res.status})`);
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    title: data.properties?.title || title,
  };
};

export const updateGoogleSheetValues = async (
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<any> => {
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal memperbarui nilai di Google Sheet (${res.status})`);
  }

  return await res.json();
};

export const readGoogleSheetValues = async (
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<any[][]> => {
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal membaca nilai dari Google Sheet (${res.status})`);
  }

  const data = await res.json();
  return data.values || [];
};

// -------------------------------------------------------------
// GOOGLE DOCS API HELPERS
// -------------------------------------------------------------
export interface CreateDocResult {
  documentId: string;
  title: string;
  documentUrl: string;
}

export const createGoogleDoc = async (
  accessToken: string,
  title: string
): Promise<CreateDocResult> => {
  const res = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal membuat Google Doc (${res.status})`);
  }

  const data = await res.json();
  return {
    documentId: data.documentId,
    title: data.title,
    documentUrl: `https://docs.google.com/document/d/${data.documentId}/edit`,
  };
};

export const insertTextToGoogleDoc = async (
  accessToken: string,
  documentId: string,
  text: string
): Promise<any> => {
  const requests = [
    {
      insertText: {
        location: { index: 1 },
        text: text,
      },
    },
  ];

  const res = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal mengisi konten Google Doc (${res.status})`);
  }

  return await res.json();
};

// -------------------------------------------------------------
// GMAIL API HELPERS
// -------------------------------------------------------------
export interface SendEmailPayload {
  to: string;
  subject: string;
  messageText: string;
  fromName?: string;
}

// Convert string to RFC 2822 compliant Base64URL string
const createMimeMessage = (
  to: string,
  subject: string,
  body: string,
  fromName = 'SIM SMK Muhammadiyah Bawang'
): string => {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `From: "${fromName}" <me>`,
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    body,
  ];
  const message = messageParts.join('\r\n');

  // Base64URL encoding (RFC 4648)
  const base64 = btoa(unescape(encodeURIComponent(message)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const sendGmailMessage = async (
  accessToken: string,
  payload: SendEmailPayload
): Promise<{ id: string; threadId: string }> => {
  const raw = createMimeMessage(
    payload.to,
    payload.subject,
    payload.messageText,
    payload.fromName
  );

  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal mengirim email via Gmail (${res.status})`);
  }

  return await res.json();
};

// -------------------------------------------------------------
// GOOGLE CALENDAR API HELPERS
// -------------------------------------------------------------
export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

export const listCalendarEvents = async (
  accessToken: string,
  maxResults = 20
): Promise<CalendarEventItem[]> => {
  const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    timeMin
  )}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal mengambil agenda Calendar (${res.status})`);
  }

  const data = await res.json();
  return data.items || [];
};

export const createCalendarEvent = async (
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    startTime: string; // ISO string e.g. 2026-09-10T08:00:00+07:00
    endTime: string;
  }
): Promise<CalendarEventItem> => {
  const body = {
    summary: event.summary,
    description: event.description || 'Jadwal SIM SMK Muhammadiyah Bawang',
    location: event.location || 'SMK Muhammadiyah Bawang',
    start: {
      dateTime: event.startTime,
      timeZone: 'Asia/Jakarta',
    },
    end: {
      dateTime: event.endTime,
      timeZone: 'Asia/Jakarta',
    },
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal membuat acara kalender (${res.status})`);
  }

  return await res.json();
};

export const deleteCalendarEvent = async (
  accessToken: string,
  eventId: string
): Promise<boolean> => {
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal menghapus acara kalender (${res.status})`);
  }

  return true;
};

// -------------------------------------------------------------
// GOOGLE TASKS API HELPERS
// -------------------------------------------------------------
export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  updated?: string;
}

export const listTasks = async (
  accessToken: string,
  tasklistId = '@default'
): Promise<GoogleTaskItem[]> => {
  const url = `https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks?showCompleted=true&showHidden=true&maxResults=30`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal mengambil daftar tugas Google Tasks (${res.status})`);
  }

  const data = await res.json();
  return data.items || [];
};

export const createTask = async (
  accessToken: string,
  task: {
    title: string;
    notes?: string;
    due?: string; // RFC 3339 timestamp
  },
  tasklistId = '@default'
): Promise<GoogleTaskItem> => {
  const body: any = {
    title: task.title,
    notes: task.notes || 'Catatan SIM Absensi & Nilai Siswa',
  };
  if (task.due) {
    body.due = task.due;
  }

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal membuat tugas di Google Tasks (${res.status})`);
  }

  return await res.json();
};

export const updateTaskStatus = async (
  accessToken: string,
  taskId: string,
  completed: boolean,
  tasklistId = '@default'
): Promise<GoogleTaskItem> => {
  const body = {
    status: completed ? 'completed' : 'needsAction',
  };

  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal memperbarui status tugas (${res.status})`);
  }

  return await res.json();
};

export const deleteTask = async (
  accessToken: string,
  taskId: string,
  tasklistId = '@default'
): Promise<boolean> => {
  const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal menghapus tugas dari Google Tasks (${res.status})`);
  }

  return true;
};
