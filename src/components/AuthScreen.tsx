import React, { FormEvent, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Baby,
  Building2,
  ClipboardList,
  Droplets,
  HeartPulse,
  Home,
  LockKeyhole,
  Mail,
  Pill,
  ShieldCheck,
  ShieldPlus,
  Stethoscope,
  Syringe,
  Thermometer,
  UserPlus,
  Users,
} from 'lucide-react';
import { supabase, fetchMyRole } from '../lib/supabase';
import { loadConfig, saveConfig } from '../utils/storage';

interface Props {
  onAuthenticated: () => void;
}

/* Live background वर तरंगणारी वैद्यकीय icons */
const FLOATING_ICONS = [
  { Icon: HeartPulse, left: '6%', size: 34, duration: '17s', delay: '-2s' },
  { Icon: Stethoscope, left: '18%', size: 26, duration: '22s', delay: '-11s' },
  { Icon: Syringe, left: '31%', size: 30, duration: '19s', delay: '-6s' },
  { Icon: Activity, left: '44%', size: 24, duration: '15s', delay: '-9s' },
  { Icon: Pill, left: '56%', size: 28, duration: '21s', delay: '-3s' },
  { Icon: ShieldPlus, left: '68%', size: 32, duration: '18s', delay: '-13s' },
  { Icon: Thermometer, left: '79%', size: 24, duration: '23s', delay: '-7s' },
  { Icon: ClipboardList, left: '89%', size: 30, duration: '16s', delay: '-1s' },
  { Icon: Droplets, left: '12%', size: 22, duration: '20s', delay: '-15s' },
  { Icon: Baby, left: '94%', size: 26, duration: '24s', delay: '-5s' },
];

const inputClass =
  'w-full rounded-xl border border-white/15 bg-white/10 py-2.5 pl-10 pr-3 text-white placeholder:text-slate-400 outline-none transition focus:border-amber-300/70 focus:bg-white/15 focus:ring-2 focus:ring-amber-300/20';

export const AuthScreen: React.FC<Props> = ({ onAuthenticated }) => {
  const [loginKind, setLoginKind] = useState<'worker' | 'phc'>('worker');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phcName, setPhcName] = useState('');
  const [subCentreName, setSubCentreName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const confirmationRedirect = import.meta.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');

    // PHC टॅबमध्ये फक्त login — signup नाही
    const effectiveMode = loginKind === 'phc' ? 'login' : mode;

    const result = effectiveMode === 'login'
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: confirmationRedirect,
          },
        });

    setIsSubmitting(false);

    if (result.error) {
      const lowerMessage = result.error.message.toLowerCase();
      if (lowerMessage.includes('not authorized') || lowerMessage.includes('email_address_not_authorized')) {
        setError('या Supabase प्रकल्पाच्या email provider कडून या पत्त्यावर confirmation email पाठवण्याची परवानगी नाही. अधिकृत email वापरा किंवा administrator ने custom SMTP जोडणे आवश्यक आहे.');
        return;
      }
      if (lowerMessage.includes('rate limit') || lowerMessage.includes('over_email_send_rate_limit')) {
        setError('Confirmation email ची rate limit पूर्ण झाली आहे. काही मिनिटांनी पुन्हा प्रयत्न करा.');
        return;
      }
      if (lowerMessage.includes('email not confirmed')) {
        setError('Please confirm your email before signing in.');
      } else if (lowerMessage.includes('password') && lowerMessage.includes('weak')) {
        setError('Choose a stronger password with at least 6 characters.');
      } else if (effectiveMode === 'login' && (lowerMessage.includes('invalid login') || lowerMessage.includes('credentials'))) {
        setError('Invalid email or password.');
      } else {
        setError('We could not complete that request. Please try again.');
      }
      return;
    }

    // नवीन खाते: PHC व उपकेंद्र नाव config मध्ये जतन करा — PHC डॅशबोर्डवर सुटसुटीत दिसावे म्हणून
    if (effectiveMode === 'signup') {
      const pn = phcName.trim();
      const sc = subCentreName.trim();
      if (pn || sc) {
        try {
          const cfg = loadConfig();
          saveConfig({ ...cfg, phcName: pn || cfg.phcName, subCentreName: sc || cfg.subCentreName });
        } catch {
          /* दुर्लक्ष करा */
        }
      }
    }

    if (effectiveMode === 'signup' && !result.data.session) {
      setMessage('Account तयार झाले. आता तुमच्या email आणि password ने login करा. जर confirmation मागितले तर Supabase Auth मध्ये email confirmation बंद करणे आवश्यक आहे.');
      setMode('login');
      return;
    }

    // PHC टॅब: login झालेल्या खात्याला खरोखर PHC भूमिका आहे का ते तपासा
    if (loginKind === 'phc') {
      const role = await fetchMyRole();
      if (role !== 'phc') {
        await supabase.auth.signOut();
        setError('हे खाते PHC खाते नाही. PHC अधिकाऱ्याचे खाते वापरा — किंवा कर्मचारी लॉगिन टॅब निवडा.');
        return;
      }
    }

    onAuthenticated();
  };

  const switchKind = (kind: 'worker' | 'phc') => {
    setLoginKind(kind);
    setMode('login');
    setError('');
    setMessage('');
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b1f33] font-['Mukta',sans-serif]">
      {/* ===== LIVE BACKGROUND ===== */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* खोल निळा-पिरोजा ग्रेडियंट */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#16456e_0%,#0b1f33_62%)]" />
        {/* तरंगणारे रंगीत blobs */}
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-emerald-600/10 blur-3xl animate-drift" />
        <div
          className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-sky-600/10 blur-3xl animate-drift"
          style={{ animationDelay: '-8s', animationDuration: '27s' }}
        />
        <div
          className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-amber-600/10 blur-3xl animate-drift"
          style={{ animationDelay: '-14s', animationDuration: '30s' }}
        />
        {/* वर तरंगणारी वैद्यकीय icons */}
        {FLOATING_ICONS.map(({ Icon, left, size, duration, delay }, i) => (
          <Icon
            key={i}
            className="absolute -bottom-[12%] text-white/10 animate-rise"
            style={{ left, width: size, height: size, animationDuration: duration, animationDelay: delay }}
          />
        ))}
        {/* तळाशी हळू सरकणारी लाट */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden opacity-[0.08]">
          <svg
            viewBox="0 0 2880 120"
            preserveAspectRatio="none"
            className="h-24 w-[200%] animate-wave"
          >
            <path
              d="M0,64 C240,96 480,32 720,48 C960,64 1200,96 1440,64 C1680,32 1920,96 2160,80 C2400,64 2640,32 2880,56 L2880,120 L0,120 Z"
              fill="#ffffff"
            />
          </svg>
        </div>
        {/* glare-guard — चमक शमवणारा एकसमान पडदा, motion दिसत राहते */}
        <div className="absolute inset-0 bg-[#0b1f33]/55" />
        {/* विग्नेट */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_52%,rgba(0,0,0,0.5)_100%)]" />
      </div>

      {/* ===== CONTENT ===== */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* अॅनिमेटेड लोगो */}
          <div className="mb-5 flex flex-col items-center animate-fade-up">
            <div className="relative h-20 w-20">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-300/50 animate-spin-slow" />
              <div className="absolute inset-2 rounded-full bg-amber-400/15 blur-xl animate-glow-pulse" />
              <div className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 shadow-lg shadow-orange-500/40">
                <ShieldCheck className="h-8 w-8 text-[#0b1f33]" />
              </div>
            </div>
            <h1 className="mt-3 bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-3xl font-extrabold text-transparent">
              आरोग्य सेवा अहवाल
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              {loginKind === 'phc' ? 'PHC अहवाल डॅशबोर्ड' : 'Smart Reporting for Health Workers'}
            </p>
          </div>

          {/* ग्लास कार्ड */}
          <section
            className="rounded-3xl border border-white/15 bg-[#12283f]/90 p-6 shadow-2xl backdrop-blur-2xl animate-scale-in sm:p-8"
            style={{ animationDelay: '120ms' }}
          >
            {/* लॉगिन प्रकार टॅब — सरकणारा indicator */}
            <div className="relative grid grid-cols-2 rounded-2xl border border-white/10 bg-black/25 p-1">
              <span
                aria-hidden="true"
                className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl bg-gradient-to-r from-amber-300 to-orange-400 shadow-lg shadow-orange-500/25 transition-transform duration-300 ease-out ${
                  loginKind === 'phc' ? 'translate-x-full' : 'translate-x-0'
                }`}
              />
              <button
                type="button"
                onClick={() => switchKind('worker')}
                className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                  loginKind === 'worker' ? 'text-[#0b1f33]' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4" />
                कर्मचारी लॉगिन
              </button>
              <button
                type="button"
                onClick={() => switchKind('phc')}
                className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                  loginKind === 'phc' ? 'text-[#0b1f33]' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Building2 className="h-4 w-4" />
                PHC लॉगिन
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="animate-fade-up" style={{ animationDelay: '180ms' }}>
                <h2 className="text-xl font-bold text-white">
                  {loginKind === 'phc' ? 'PHC मध्ये साइन इन करा' : mode === 'login' ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  {loginKind === 'phc'
                    ? 'सर्व उपकेंद्रांचे अहवाल एकाच ठिकाणी पहा व फिल्टर करा.'
                    : mode === 'login'
                      ? 'Sign in to access your health centre workspace.'
                      : 'Use your personal email to create an individual account.'}
                </p>
              </div>

              <label className="block text-sm font-semibold text-slate-200 animate-fade-up" style={{ animationDelay: '220ms' }}>
                Email address
                <span className="relative mt-1 block">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                  <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="you@example.com" />
                </span>
              </label>

              {loginKind === 'worker' && mode === 'signup' && (
                <>
                  <label className="block text-sm font-semibold text-slate-200 animate-fade-up">
                    प्राथमिक आरोग्य केंद्राचे नाव *
                    <span className="relative mt-1 block">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                      <input required type="text" value={phcName} onChange={(event) => setPhcName(event.target.value)} className={inputClass} placeholder="उदा. देहरे PHC" />
                    </span>
                  </label>

                  <label className="block text-sm font-semibold text-slate-200 animate-fade-up">
                    उपकेंद्राचे नाव *
                    <span className="relative mt-1 block">
                      <Home className="absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                      <input required type="text" value={subCentreName} onChange={(event) => setSubCentreName(event.target.value)} className={inputClass} placeholder="उदा. वडगाव गुप्ता" />
                    </span>
                  </label>
                </>
              )}

              <label className="block text-sm font-semibold text-slate-200 animate-fade-up" style={{ animationDelay: '260ms' }}>
                Password
                <span className="relative mt-1 block">
                  <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                  <input required minLength={6} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} placeholder="At least 6 characters" />
                </span>
              </label>

              {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm text-red-200 animate-fade-in">{error}</p>}
              {message && <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-200 animate-fade-in">{message}</p>}

              <button
                disabled={isSubmitting}
                type="submit"
                className="pressable relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-amber-300 to-orange-500 px-4 py-3 font-bold text-[#0b1f33] shadow-lg shadow-orange-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 animate-fade-up"
                style={{ animationDelay: '300ms' }}
              >
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-1/4 bg-white/20 blur-lg animate-shimmer" />
                {isSubmitting ? 'Please wait...' : loginKind === 'phc' ? 'PHC मध्ये साइन इन करा' : mode === 'login' ? 'Sign in' : 'Create account'}
                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
              </button>

              {loginKind === 'worker' && (
                <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }} className="mx-auto flex items-center gap-2 text-sm font-semibold text-amber-300 transition hover:text-amber-200 hover:underline">
                  <UserPlus className="h-4 w-4" />
                  {mode === 'login' ? 'Create an individual account' : 'Already have an account? Sign in'}
                </button>
              )}
            </form>
          </section>

          <p className="mt-4 text-center text-xs text-slate-400 animate-fade-in" style={{ animationDelay: '400ms' }}>
            आरोग्य विभाग • सुरक्षित लॉगिन
          </p>
        </div>
      </div>
    </main>
  );
};
