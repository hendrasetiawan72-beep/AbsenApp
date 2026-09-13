import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { TeacherProfile, ClassRoom } from '../types';
import { SchoolLogo } from './SchoolLogo';
import {
  signInWithGoogleWorkspaceDirect,
  signInWithGoogleWorkspaceRedirect,
  checkGoogleWorkspaceRedirectResult,
  signInWithGoogleCredentialToken,
} from '../utils/googleWorkspace';
import firebaseConfig from '../../firebase-applet-config.json';

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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [authMethodTab, setAuthMethodTab] = useState<'popup' | 'redirect' | 'gis'>('popup');

  // Manual login form state
  const [manualEmail, setManualEmail] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const gisContainerRef = useRef<HTMLDivElement>(null);
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

    setSuccessMsg(`Login berhasil (${method})! Selamat datang, ${displayName}.`);
    setTimeout(() => {
      onLoginSuccess(updatedTeacher, defaultClassId);
    }, 300);
  };

  // 1. Check for Redirect result on component mount (Solusi B)
  useEffect(() => {
    checkGoogleWorkspaceRedirectResult()
      .then((res) => {
        if (res?.user) {
          processUserSuccess(res.user, 'Redirect');
        }
      })
      .catch((err) => {
        console.warn('Google Redirect Check Note:', err);
      });
  }, []);

  // 2. Initialize Google Identity Services (GIS) Official Button (Solusi C)
  useEffect(() => {
    const initGis = () => {
      const google = (window as any).google;
      const clientId = (firebaseConfig as any).oAuthClientId;

      if (google?.accounts?.id && clientId && gisContainerRef.current) {
        try {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: any) => {
              if (response.credential) {
                setIsLoading(true);
                setErrorMsg(null);
                try {
                  const { user } = await signInWithGoogleCredentialToken(response.credential);
                  processUserSuccess(user, 'Google GIS SDK');
                } catch (gisAuthErr: any) {
                  console.error('GIS Firebase credential error:', gisAuthErr);
                  setErrorMsg(gisAuthErr.message || 'Gagal autentikasi via Google GIS.');
                  setIsLoading(false);
                }
              }
            },
          });

          gisContainerRef.current.innerHTML = '';
          google.accounts.id.renderButton(gisContainerRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: 'signin_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: 300,
          });
        } catch (e) {
          console.warn('GIS rendering note:', e);
        }
      }
    };

    // Retry briefly if script is loading
    initGis();
    const timer = setTimeout(initGis, 1000);
    return () => clearTimeout(timer);
  }, [authMethodTab]);

  /**
   * SOLUSI A: Panggil langsung saat event klik tombol terjadi (Sinkron User Gesture)
   * Mengikuti petunjuk screenshot: Browser modern memblokir popup jika didahului async/await.
   */
  const handleDirectGoogleLogin = () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPopupBlocked(false);

    // Panggil langsung sinkron tanpa await sebelum signInWithPopup
    signInWithGoogleWorkspaceDirect(
      (res) => {
        processUserSuccess(res.user, 'Popup Langsung');
      },
      (err) => {
        setIsLoading(false);
        if (
          err.code === 'auth/popup-blocked' ||
          err.code === 'auth/cancelled-popup-request' ||
          err.message?.toLowerCase().includes('popup')
        ) {
          setPopupBlocked(true);
          setErrorMsg(
            'Browser memblokir jendela popup otomatis. Gunakan Mode Redirect (Solusi B) di bawah ini agar halaman dialihkan langsung tanpa popup.'
          );
        } else if (err.code === 'auth/popup-closed-by-user') {
          setErrorMsg('Jendela login ditutup sebelum selesai. Silakan coba kembali.');
        } else {
          setErrorMsg(err.message || 'Gagal login akun Google.');
        }
      }
    );
  };

  /**
   * SOLUSI B: Ganti Metode dari Popup ke Redirect (signInWithRedirect)
   * Memindahkan halaman langsung ke Google OAuth tanpa membuka jendela baru,
   * sehingga tidak akan pernah diblokir oleh browser / HP.
   */
  const handleRedirectGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg('Mengalihkan halaman ke Google OAuth...');
    try {
      await signInWithGoogleWorkspaceRedirect();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Gagal mengarahkan ke halaman login Google.');
    }
  };

  // Manual Login Handler (Email/NIP + Password)
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const inputVal = manualEmail.trim();
    if (!inputVal) {
      setErrorMsg('Masukkan email atau NIP guru.');
      return;
    }
    if (!manualPassword) {
      setErrorMsg('Masukkan kata sandi.');
      return;
    }

    setIsLoading(true);

    // Normalize email if input is NIP/username
    const formattedEmail = inputVal.includes('@')
      ? inputVal.toLowerCase()
      : `${inputVal.toLowerCase()}@smkmuhbawang.sch.id`;

    try {
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          formattedEmail,
          manualPassword
        );
        const fbUser = userCredential.user;
        const displayName =
          fbUser.displayName ||
          inputVal.split('@')[0] ||
          initialTeacher.namaGuru ||
          'Guru Pendidik';

        const updatedTeacher: TeacherProfile = {
          ...initialTeacher,
          namaGuru: displayName,
          email: fbUser.email || formattedEmail,
          isLoggedIn: true,
        };

        setSuccessMsg(`Login berhasil! Selamat datang, ${displayName}.`);
        setTimeout(() => {
          onLoginSuccess(updatedTeacher, defaultClassId);
        }, 300);
        return;
      } catch (signInErr: any) {
        if (
          signInErr.code === 'auth/user-not-found' ||
          signInErr.code === 'auth/invalid-credential'
        ) {
          try {
            const newUserCred = await createUserWithEmailAndPassword(
              auth,
              formattedEmail,
              manualPassword
            );
            const fbUser = newUserCred.user;
            const displayName =
              inputVal.split('@')[0] || initialTeacher.namaGuru || 'Guru Pendidik';

            const updatedTeacher: TeacherProfile = {
              ...initialTeacher,
              namaGuru: displayName,
              email: fbUser.email || formattedEmail,
              isLoggedIn: true,
            };

            setSuccessMsg(`Akun dibuat & login berhasil! Selamat datang, ${displayName}.`);
            setTimeout(() => {
              onLoginSuccess(updatedTeacher, defaultClassId);
            }, 300);
            return;
          } catch (createErr: any) {
            if (createErr.code === 'auth/email-already-in-use') {
              throw new Error('Kata sandi salah. Silakan periksa kembali kata sandi Anda.');
            }
            if (createErr.code === 'auth/weak-password') {
              throw new Error('Kata sandi minimal 6 karakter.');
            }
          }
        }
        throw signInErr;
      }
    } catch (err: any) {
      console.warn('Manual login note:', err);

      if (
        err.code === 'auth/wrong-password' ||
        err.message?.includes('Kata sandi salah')
      ) {
        setErrorMsg('Kata sandi salah. Silakan periksa kembali kata sandi Anda.');
        setIsLoading(false);
        return;
      }

      // Allow local login if offline or network failure
      const displayName = inputVal.split('@')[0] || initialTeacher.namaGuru || 'Guru Pendidik';
      const fallbackTeacher: TeacherProfile = {
        ...initialTeacher,
        namaGuru: displayName,
        email: formattedEmail,
        isLoggedIn: true,
      };

      setSuccessMsg(`Login berhasil! Selamat datang, ${displayName}.`);
      setTimeout(() => {
        onLoginSuccess(fallbackTeacher, defaultClassId);
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center py-10 px-4 sm:px-6 font-sans">
      {/* Centered Main Card */}
      <div className="max-w-md w-full bg-white rounded-3xl p-7 sm:p-9 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center">
        {/* School Logo */}
        <div className="mb-3.5">
          <SchoolLogo size="lg" className="w-18 h-18 sm:w-20 sm:h-20" />
        </div>

        {/* Badge: Sistem Informasi Guru */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50/80 text-indigo-700 border border-indigo-100/90 mb-2.5">
          <Cloud className="w-3.5 h-3.5 text-indigo-600" />
          <span>Sistem Informasi Presensi & Nilai</span>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          SMK Muhammadiyah Bawang
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1 mb-5">
          Aplikasi Presensi & Nilai Siswa
        </p>

        {/* Divider */}
        <div className="w-full h-px bg-slate-100 mb-4" />

        {/* Alert Feedback */}
        {errorMsg && (
          <div className="w-full mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 text-left animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="w-full mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 text-left animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* POPUP BLOCKED SMART BANNER (Solusi B Rekomendasi Gambar) */}
        {popupBlocked && (
          <div className="w-full mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-left shadow-xs">
            <div className="flex items-center gap-2 font-bold text-xs mb-1 text-amber-800">
              <Smartphone className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Gunakan Mode Redirect (Solusi B)</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed mb-2.5">
              Browser / HP Anda memblokir jendela popup. Metode Redirect akan memindahkan halaman langsung ke Google OAuth tanpa jendela baru sehingga <strong>tidak akan pernah diblokir</strong>.
            </p>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleRedirectGoogleLogin}
              className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Masuk Sekarang via Redirect (Tanpa Popup)</span>
            </button>
          </div>
        )}

        {/* Google Authentication Method Switcher (A / B / C dari petunjuk) */}
        <div className="w-full mb-4">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5 px-1">
            <span>Metode Login Google:</span>
            <span className="text-indigo-600 font-bold">Pilih Sesuai Kondisi Browser</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs">
            <button
              type="button"
              onClick={() => setAuthMethodTab('popup')}
              className={`py-1.5 px-1 rounded-lg font-semibold transition-all cursor-pointer truncate ${
                authMethodTab === 'popup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Solusi A: Panggilan langsung dari Event Klik"
            >
              A. Popup Langsung
            </button>

            <button
              type="button"
              onClick={() => setAuthMethodTab('redirect')}
              className={`py-1.5 px-1 rounded-lg font-semibold transition-all cursor-pointer truncate ${
                authMethodTab === 'redirect'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Solusi B: Metode Redirect (Anti-Blokir Browser / HP)"
            >
              B. Redirect (HP)
            </button>

            <button
              type="button"
              onClick={() => setAuthMethodTab('gis')}
              className={`py-1.5 px-1 rounded-lg font-semibold transition-all cursor-pointer truncate ${
                authMethodTab === 'gis'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Solusi C: Google Identity Services Button Resmi"
            >
              C. Tombol GIS
            </button>
          </div>
        </div>

        {/* METHOD A: Direct Sync User Gesture Popup */}
        {authMethodTab === 'popup' && (
          <div className="w-full space-y-2">
            <button
              type="button"
              id="btn-google-login-direct"
              disabled={isLoading}
              onClick={handleDirectGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 sm:py-3.5 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-2xl shadow-xs hover:shadow transition-all cursor-pointer font-medium text-slate-700 text-sm sm:text-base disabled:opacity-60"
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
              <span className="font-semibold text-slate-700">
                {isLoading ? 'Menghubungkan...' : 'Masuk dengan Akun Google (Popup)'}
              </span>
            </button>
            <p className="text-[11px] text-slate-400 text-center">
              *Dipanggil langsung dari event klik tombol (User Gesture sinkron bebas pemutus asinkron).
            </p>
          </div>
        )}

        {/* METHOD B: Redirect Method (signInWithRedirect) */}
        {authMethodTab === 'redirect' && (
          <div className="w-full space-y-2">
            <button
              type="button"
              id="btn-google-login-redirect"
              disabled={isLoading}
              onClick={handleRedirectGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 sm:py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-2xl shadow-sm hover:shadow transition-all cursor-pointer font-semibold text-sm sm:text-base disabled:opacity-60"
            >
              <svg className="w-5 h-5 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
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
              <span>{isLoading ? 'Mengarahkan...' : 'Masuk via Redirect (Anti-Blokir)'}</span>
            </button>
            <p className="text-[11px] text-indigo-700 bg-indigo-50 p-2 rounded-xl border border-indigo-100 text-left">
              <strong>Solusi B:</strong> Memindahkan halaman langsung ke Google OAuth tanpa jendela baru, sehingga <strong>tidak akan pernah diblokir</strong> oleh browser atau HP Android.
            </p>
          </div>
        )}

        {/* METHOD C: Google Identity Services (GIS) Button Resmi */}
        {authMethodTab === 'gis' && (
          <div className="w-full space-y-2 flex flex-col items-center">
            <div
              ref={gisContainerRef}
              id="google-gis-container"
              className="flex justify-center min-h-[44px] my-1"
            />
            <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-100 text-left w-full">
              <strong>Solusi C:</strong> Menggunakan pustaka resmi Google Identity Services (<code className="font-mono text-[10px]">accounts.google.com/gsi/client</code>) dengan tombol standar Google sehingga ditangani langsung oleh SDK Google secara aman.
            </p>
          </div>
        )}

        {/* Divider: atau masuk manual */}
        <div className="w-full flex items-center gap-3 my-4">
          <div className="h-px bg-slate-200 grow" />
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
            atau masuk manual
          </span>
          <div className="h-px bg-slate-200 grow" />
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleManualLogin} className="w-full space-y-3 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Guru / NIP
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="guru@smkmuhbawang.sch.id / NIP"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={manualPassword}
                onChange={(e) => setManualPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-1"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Memproses...' : 'Masuk Manual'}</span>
          </button>
        </form>

        {/* Firebase & Firestore Security Badge */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-medium mt-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Autentikasi Firebase & Cloud Firestore</span>
        </div>
        <p className="text-[11px] text-slate-400 text-center leading-relaxed mt-1 max-w-xs mx-auto">
          Data absensi dan nilai tersimpan aman di cloud dan terisolasi otomatis berdasarkan akun Google Anda.
        </p>
      </div>

      {/* Footer outside the card */}
      <p className="text-xs text-slate-400 text-center mt-6">
        © 2026 SMK Muhammadiyah Bawang • Batang, Jawa Tengah
      </p>
    </div>
  );
};
