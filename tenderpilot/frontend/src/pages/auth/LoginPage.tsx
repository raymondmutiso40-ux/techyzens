import React from 'react';
import { Sparkles, Phone, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sign in to TenderPilot</h1>
          <p className="text-xs text-slate-500">
            SMS One-Time Code authentication via Thrivewave API
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
          <p className="font-semibold text-slate-800">Bundle A Work Area: SMS OTP Login</p>
          <p>
            Connect Thrivewave SMS endpoint to request 6-digit code for phone numbers (e.g. +254XXXXXXXXX).
          </p>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Phone Number (E.164)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="phone"
                type="tel"
                placeholder="+254 712 345 678"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition-colors shadow-xs"
          >
            <span>Send Verification Code</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center">
          <Link to="/tenders" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
            Continue to App Demo (Skip Login) →
          </Link>
        </div>
      </div>
    </div>
  );
};
