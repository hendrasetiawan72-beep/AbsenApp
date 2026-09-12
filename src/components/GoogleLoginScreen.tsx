import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  MessageCircle,
  ExternalLink,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { TeacherProfile, ClassRoom } from '../types';
import { SchoolLogo } from './SchoolLogo';
import { signInWithGoogleWorkspace } from '../utils/googleWorkspace';
import {
  isEmailRegistered,
  DEFAULT_ADMIN_WHATSAPP,
  DEFAULT_ADMIN_WHATSAPP_LINK,
} from '../utils/whitelist';

interface GoogleLoginScreenProps {
  initialTeacher: TeacherProfile;
  existingClasses: ClassRoom[];
  onLoginSuccess: (teacher: TeacherProfile, selectedClassId?: string, newClass?: ClassRoom) => void;
}

export const GoogleLoginScreen: React.FC<GoogleLoginScreenProps> = ({
  initialTeacher,
  existingClasses,
  onLoginSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unregisteredEmail, setUnregisteredEmail] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Default to the first existing class
  const defaultClassId = existingClasses[0]?.id;

  // Google Sign-In with Whitelist Validation
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setUnregisteredEmail(null);
    setSuccessMsg(null);

    try {
      const { user } = await signInWithGoogleWorkspace();
      if (user) {
        const userEmail = (user.email || '').trim().toLowerCase();

        // Check if user's Google account is registered with admin
        const isRegistered = isEmailRegistered(userEmail);

        if (!isRegistered) {
          // Deny access: sign out immediately
          await signOut(auth);
          setUnregisteredEmail(userEmail);
          setErrorMsg(
            `Akun Google (${userEmail}) belum terdaftar ke admin. Silakan konfirmasi ke admin untuk aktivasi hak akses.`
          );
          setIsLoading(false);
          return;
        }

        // Approved teacher
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
        }, 350);
      }
    } catch (err: any) {
      console.warn('Google Sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Jendela login Google ditutup. Silakan coba kembali.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setErrorMsg('Permintaan login dibatalkan.');
      } else {
        setErrorMsg(
          err.message ||
            'Gagal terhubung dengan akun Google. Pastikan izin popup browser aktif.'
        );
      }
      setIsLoading(false);
    }
  };

  // WhatsApp prefilled message URL
  const getWhatsAppRegistrationUrl = (emailToRegister?: string) => {
    const text = emailToRegister
      ? `Assalamu'alaikum Admin SMK Muhammadiyah Bawang, mohon daftarkan email Google saya untuk aplikasi SIM Presensi & Nilai Siswa:\n\nEmail: ${emailToRegister}`
      : `Assalamu'alaikum Admin SMK Muhammadiyah Bawang, saya ingin mendaftarkan akun Google saya untuk SIM Presensi & Nilai Siswa.`;
    return `https://wa.me/${DEFAULT_ADMIN_WHATSAPP}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-slate-50 via-indigo-50/40 to-slate-100 flex flex-col justify-center items-center py-10 px-4 sm:px-6 font-sans">
      {/* Soft Ambient Glows (Minimalist & Bright) */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-200/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-sky-200/35 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-5">
        {/* School Identity Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex p-3 rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70 mb-0.5">
            <SchoolLogo size="lg" className="w-14 h-14" />
          </div>

          <div>
            <div className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/70 mb-2">
              SIM Presensi & Rekap Nilai Siswa
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              SMK Muhammadiyah Bawang
            </h1>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto mt-1">
              Portal administrasi presensi harian & penilaian berbasis kurikulum
            </p>
          </div>
        </div>

        {/* Minimalist Bright Login Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-200/80 overflow-hidden">
          {/* Subtle Top Accent Ribbon */}
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500" />

          <div className="p-6 sm:p-7 space-y-4">
            {/* Access Restriction Notice */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs">
              <Lock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="font-medium text-[11px] leading-tight">
                Hanya akun Google yang sudah terdaftar ke Admin yang dapat masuk
              </span>
            </div>

            {/* Error / Denied Feedback Banner */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-start gap-2 font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>Akses Belum Terdaftar</span>
                </div>
                <p className="text-rose-700 leading-relaxed pl-6">{errorMsg}</p>

                {unregisteredEmail && (
                  <div className="pt-1.5 pl-6">
                    <a
                      href={getWhatsAppRegistrationUrl(unregisteredEmail)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer text-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Daftarkan ke Admin via WhatsApp</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Success Feedback Banner */}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="grow font-semibold">{successMsg}</div>
              </div>
            )}

            {/* Primary Google Login Button */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                id="btn-google-login"
                disabled={isLoading}
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 active:bg-slate-100 border-2 border-indigo-200 hover:border-indigo-600 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50 group"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-900 transition-colors">
                  {isLoading ? 'Memeriksa Pendaftaran Akun...' : 'Masuk dengan Akun Google'}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors ml-auto shrink-0" />
              </button>

              <p className="text-[11px] text-center text-slate-400 font-medium">
                Mendukung akun @smkmuhbawang.sch.id & Gmail pribadi
              </p>
            </div>

            {/* Admin WhatsApp Info Box */}
            <div className="pt-3 border-t border-slate-100">
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-800 truncate">
                      Pendaftaran Akun Guru
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      Hubungi admin via WhatsApp
                    </div>
                  </div>
                </div>

                <a
                  href={getWhatsAppRegistrationUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-100/60 border border-emerald-300 px-2.5 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer text-[11px] shrink-0"
                >
                  <span>wa.me/{DEFAULT_ADMIN_WHATSAPP}</span>
                  <ExternalLink className="w-3 h-3 text-emerald-600" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Minimalist Footer */}
        <div className="text-center space-y-1 text-slate-400 text-xs">
          <p className="flex items-center justify-center gap-1.5 text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>SIM Presensi & Rekap Nilai • SMK Muhammadiyah Bawang</span>
          </p>
          <p className="text-[11px] text-slate-400">
            Info Pendaftaran:{' '}
            <a
              href={DEFAULT_ADMIN_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline font-mono"
            >
              wa.me/{DEFAULT_ADMIN_WHATSAPP}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
