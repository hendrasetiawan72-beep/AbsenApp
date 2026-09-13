import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  LogIn,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { TeacherProfile, ClassRoom } from '../types';
import { SchoolLogo } from './SchoolLogo';
import {
  signInWithGoogleWorkspaceDirect,
  signInWithGoogleWorkspaceRedirect,
  checkGoogleWorkspaceRedirectResult,
} from '../utils/googleWorkspace';

interface GoogleLoginScreenProps {
  initialTeacher: TeacherProfile;
  existingClasses: ClassRoom[];
  onLoginSuccess: (
    teacher: TeacherProfile,
    selectedClassId?: string,
    newClass?: ClassRoom
  ) => void;
}

export const GoogleLoginScreen: React.FC<GoogleLoginScreenProps> = ({
  initialTeacher,
  existingClasses,
  onLoginSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const defaultClassId = existingClasses[0]?.id;

  // Process successful user login
  const processUserSuccess = (user: User, method: string = 'Google') => {
    const userEmail = (user.email || '').trim();
    const displayName =
      user.displayName ||
      userEmail.split('@')[0] ||
      initialTeacher.namaGuru ||
      'Guru Pendidik';

    const updatedTeacher: TeacherProfile = {
      ...initialTeacher,
      namaGuru: displayName,
      email: user.email || '',
      avatarUrl: user.photoURL || '',
      isLoggedIn: true,
    };

    setSuccessMsg(`Login berhasil! Selamat datang, ${displayName}.`);
    setTimeout(() => {
      onLoginSuccess(updatedTeacher, defaultClassId);
    }, 300);
  };

  // Check for redirect login result on component mount
  useEffect(() => {
    checkGoogleWorkspaceRedirectResult()
      .then((res) => {
        if (res?.user) {
          processUserSuccess(res.user, 'Google');
        }
      })
      .catch((err) => {
        console.warn('Google Redirect Check Note:', err);
      });
  }, []);

  // Single, direct Google Login Handler
  const handleGoogleLogin = () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Call popup synchronously on user gesture
    signInWithGoogleWorkspaceDirect(
      (res) => {
        processUserSuccess(res.user, 'Google');
      },
      async (err) => {
        console.warn('Google sign-in popup note:', err);

        // If browser blocks the popup window (common on mobile or strict browser settings)
        if (
          err.code === 'auth/popup-blocked' ||
          err.code === 'auth/cancelled-popup-request' ||
          err.message?.toLowerCase().includes('popup')
        ) {
          setErrorMsg('Mengalihkan ke halaman login Google...');
          try {
            await signInWithGoogleWorkspaceRedirect();
            return;
          } catch (redirectErr: any) {
            setIsLoading(false);
            setErrorMsg(
              redirectErr.message ||
                'Gagal mengalihkan ke halaman login Google. Silakan coba kembali.'
            );
            return;
          }
        }

        setIsLoading(false);
        if (err.code === 'auth/popup-closed-by-user') {
          setErrorMsg('Jendela login ditutup sebelum selesai. Silakan klik tombol Masuk kembali.');
        } else {
          setErrorMsg(err.message || 'Gagal masuk dengan akun Google. Silakan coba lagi.');
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center py-10 px-4 sm:px-6 font-sans">
      {/* Centered Main Card */}
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center text-center">
        {/* School Logo */}
        <div className="mb-4">
          <SchoolLogo size="lg" className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-xs" />
        </div>

        {/* Badge: Sistem Informasi Guru */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-3">
          <Cloud className="w-3.5 h-3.5 text-indigo-600" />
          <span>Sistem Informasi Presensi & Nilai</span>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          SMK Muhammadiyah Bawang
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 mb-6">
          Aplikasi Presensi, Penilaian & Buku Jurnal Guru
        </p>

        {/* Divider */}
        <div className="w-full h-px bg-slate-100 mb-6" />

        {/* Alert Feedback */}
        {errorMsg && (
          <div className="w-full mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 text-left animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="w-full mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 text-left animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-bold leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Single Form: Google Account Login Only */}
        <div className="w-full space-y-3">
          <button
            type="button"
            id="btn-google-login"
            disabled={isLoading}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-white hover:bg-slate-50 active:bg-slate-100 border-2 border-slate-200 hover:border-indigo-500 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer font-bold text-slate-800 text-sm sm:text-base disabled:opacity-60 group"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>
              {isLoading ? 'Menghubungkan ke Akun Google...' : 'Masuk dengan Akun Google'}
            </span>
          </button>

          <p className="text-xs text-slate-400 leading-relaxed pt-1">
            Gunakan akun Google Anda untuk masuk secara instan dan aman.
          </p>
        </div>

        {/* Security & Cloud Badge */}
        <div className="w-full mt-7 pt-5 border-t border-slate-100 flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Tersambung ke Cloud Firestore</span>
          </div>
          <p className="text-[11px] text-slate-400 text-center leading-relaxed mt-1 max-w-xs">
            Seluruh data presensi dan nilai tersimpan aman di cloud dan terhubung otomatis dengan akun Google Anda.
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-slate-400 text-center mt-6">
        © 2026 SMK Muhammadiyah Bawang • Batang, Jawa Tengah
      </p>
    </div>
  );
};
