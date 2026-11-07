import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button, Input } from '../../components/ui';
import { MEDIA } from '../../data/media';

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('+254 712 345 678');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);
  const [expiryTimer, setExpiryTimer] = useState(300);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer: any;
    if (step === 'OTP' && cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, cooldown]);

  useEffect(() => {
    let timer: any;
    if (step === 'OTP' && expiryTimer > 0) {
      timer = setInterval(() => setExpiryTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, expiryTimer]);

  const handleRequestCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 8) {
      setError('Enter a valid phone number (e.g. +254 712 345 678).');
      return;
    }
    setError(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setStep('OTP');
      setCooldown(60);
      setExpiryTimer(300);
    }, 500);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      val = val[val.length - 1];
    }
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length !== 6) {
      setError('Enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    setTimeout(() => {
      setLoading(false);
      login(phone);
      navigate('/dashboard');
    }, 400);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-[#faf9f7]">
      {/* Left: photo + video panel */}
      <aside className="relative overflow-hidden min-h-[220px] lg:min-h-screen flex flex-col justify-between p-6 lg:p-10 text-white">
        <img src={MEDIA.loginImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={MEDIA.loginImage}
        >
          <source src={MEDIA.loginVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/40 to-stone-950/30" />

        <Link to="/" className="relative flex items-center gap-2 w-fit">
          <span className="h-7 w-7 rounded bg-white text-stone-900 text-xs font-semibold flex items-center justify-center">
            TP
          </span>
          <span className="font-semibold tracking-tight">TenderPilot</span>
        </Link>

        <div className="relative hidden lg:block max-w-md">
          <p className="font-serif text-3xl leading-snug">
            Good tenders don't wait. Neither should your first draft.
          </p>
          <p className="text-sm text-white/75 mt-3">
            Your shortlist, fit scores and drafts are where you left them.
          </p>
        </div>
      </aside>

      {/* Right: sign-in form */}
      <section className="relative flex items-center justify-center p-4 py-14">
        <Link
          to="/"
          className="absolute top-5 right-5 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to site
        </Link>
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-md p-6 space-y-5">
        <div>
          <div className="h-6 w-6 rounded bg-slate-900 text-white text-xs font-semibold flex items-center justify-center mb-3">
            TP
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Sign in to TenderPilot</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            SMS one-time code authentication.
          </p>
        </div>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
            {error}
          </div>
        )}

        {step === 'PHONE' ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <Input
              label="Phone number (E.164)"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254 712 345 678"
              required
            />

            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              {loading ? 'Sending code...' : 'Send verification code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-700">Verification code</label>
                <span className="text-xs text-slate-500">Expires in {formatSeconds(expiryTimer)}</span>
              </div>

              <div className="flex justify-between gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-10 h-10 text-center text-sm font-semibold border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white"
                  />
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Sent to {phone}</span>
                <button
                  type="button"
                  onClick={() => setStep('PHONE')}
                  className="text-blue-600 hover:underline"
                >
                  Change
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              {loading ? 'Verifying...' : 'Sign in'}
            </Button>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <button
                type="button"
                disabled={cooldown > 0}
                onClick={() => setCooldown(60)}
                className="hover:text-slate-900 disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
              <button
                type="button"
                onClick={() => setOtp(['1', '2', '3', '4', '5', '6'])}
                className="text-blue-600 hover:underline font-medium"
              >
                Fill 123456
              </button>
            </div>
          </form>
        )}

        <div className="pt-3 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => {
              login(phone);
              navigate('/dashboard');
            }}
            className="text-xs text-slate-500 hover:text-slate-900"
          >
            Skip to demo
          </button>
        </div>
      </div>
      </section>
    </div>
  );
};
