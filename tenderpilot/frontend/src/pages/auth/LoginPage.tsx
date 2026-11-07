import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Phone,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('+254 712 345 678');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);
  const [expiryTimer, setExpiryTimer] = useState(300); // 5 minutes
  const [attempts, setAttempts] = useState(5);
  const [loading, setLoading] = useState(false);

  // Cooldown timer
  useEffect(() => {
    let timer: any;
    if (step === 'OTP' && cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, cooldown]);

  // Expiry timer
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
      setError('Please provide a valid phone number (e.g. +254 7XX XXX XXX)');
      return;
    }
    setError(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setStep('OTP');
      setCooldown(60);
      setExpiryTimer(300);
      setAttempts(5);
    }, 700);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      val = val[val.length - 1];
    }
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto-advance focus to next input
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
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    setTimeout(() => {
      setLoading(false);
      // Demo acceptance: allows 123456 or any code in hackathon mode
      if (enteredCode === '123456' || enteredCode.length === 6) {
        login(phone);
        navigate('/tenders');
      } else {
        const remaining = attempts - 1;
        setAttempts(remaining);
        if (remaining <= 0) {
          setError('Too many invalid attempts. Code invalidated. Request a new code.');
          setStep('PHONE');
        } else {
          setError(`Invalid code. ${remaining} attempts remaining.`);
        }
      }
    }, 800);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-100">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sign in to TenderPilot</h1>
          <p className="text-xs text-slate-500">
            Enterprise proposal copilot for advisory & consulting firms
          </p>
        </div>

        {/* Thrivewave SMS Badge */}
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 flex items-center space-x-3 text-xs text-indigo-900">
          <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <span className="font-semibold">SMS OTP Authentication: </span>
            Powered by Thrivewave Gateway API.
          </div>
        </div>

        {error && (
          <div className="flex items-center space-x-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'PHONE' ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                Phone Number (E.164)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 712 345 678"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                We will send a 6-digit one-time code to this number.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <span>{loading ? 'Sending SMS...' : 'Send Verification Code'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase text-slate-700">
                  Enter 6-Digit Code
                </label>
                <span className="text-xs font-medium text-amber-600">
                  Expires in {formatSeconds(expiryTimer)}
                </span>
              </div>

              {/* 6-box input */}
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
                    onKeyDown={(e) => handleOtpKeyDown(idx, e.key)}
                    className="w-12 h-12 text-center text-lg font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 bg-slate-50"
                  />
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Sent to {phone}</span>
                <button
                  type="button"
                  onClick={() => setStep('PHONE')}
                  className="text-indigo-600 hover:underline"
                >
                  Change
                </button>
              </div>

              <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-center justify-between">
                <span>Demo Code: <strong className="font-mono text-indigo-700">123456</strong></span>
                <button
                  type="button"
                  onClick={() => setOtp(['1', '2', '3', '4', '5', '6'])}
                  className="text-indigo-600 hover:underline font-semibold"
                >
                  Auto-fill
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <span>{loading ? 'Verifying...' : 'Verify & Enter TenderPilot'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                disabled={cooldown > 0}
                onClick={() => setCooldown(60)}
                className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-indigo-600 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code via SMS'}
                </span>
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-2 border-t border-slate-100">
          <button
            onClick={() => {
              login(phone);
              navigate('/tenders');
            }}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            Direct Demo Mode (Skip Login) →
          </button>
        </div>
      </div>
    </div>
  );
};
