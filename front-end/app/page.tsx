'use client';

import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const passwordRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/challenge");
      return;
    }
    setCheckingAuth(false);
  }, [router]);

  const handleAuthAction = async () => {
    if (!email || !password) {
      alert("กรุณากรอก Email และ Password");
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("https://api.hogword.site/auth/signin-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Error:", data);
        throw new Error(data.detail ? JSON.stringify(data.detail) : "เกิดข้อผิดพลาด");
      }
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        if (data.user_id) localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("user_email", email);
      }
      router.replace("/challenge");
    } catch (error) {
      console.error(error);
      alert("ทำรายการไม่สำเร็จ: กรุณาตรวจสอบอีเมลหรือรหัสผ่าน");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!email) return;
      passwordRef.current?.focus();
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAuthAction();
    }
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center p-4 font-sans text-slate-800 relative"
        style={{ background: 'linear-gradient(135deg, #E0F7FA 0%, #FFFFFF 50%, #FFEDD5 100%)' }}>
        <div className="bg-white rounded-2xl w-full max-w-[440px] p-8 shadow-lg border border-white/60 text-center">
          <div className="text-lg font-semibold text-gray-600">Checking authentication…</div>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* ซ่อนไอคอน reveal ของ browser*/}
      <style>{`
        /* Edge / IE */
        input::-ms-reveal, input::-ms-clear { display: none; }

        /* Chrome/Chromium based browsers (attempts) */
        input::-webkit-credentials-auto-fill-button { display: none !important; }
        input::-webkit-autofill-button { display: none !important; }
        input::-webkit-textfield-decoration-button { display: none !important; }
        /* Some browsers use this for the reveal button */
        input::-webkit-password-reveal-button { display: none !important; }

        /* Prevent autofill background color (optional) */
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0px 1000px white inset; box-shadow: 0 0 0px 1000px white inset; }

        /* Ensure our toggle button sits above other UI */
        .pw-toggle-button { z-index: 5; }
      `}</style>

      <main className="min-h-screen w-full flex items-center justify-center p-4 font-sans text-slate-800 relative"
        style={{ background: 'linear-gradient(135deg, #E0F7FA 0%, #FFFFFF 50%, #FFEDD5 100%)' }}>

        {/* LOGO */}
        <div className="absolute top-10 left-10 flex items-center gap-3 cursor-pointer select-none" onClick={() => router.push('/')}>
          <svg width="32" height="32" viewBox="0 0 24 24" className="shrink-0">
            <path d="M12 2.5 L14.7 8.5 L21 11.2 L14.7 13.9 L12 19.9 L9.3 13.9 L3 11.2 L9.3 8.5 Z" fill="#5B2588" />
            <circle cx="5" cy="19" r="2.5" fill="#5B2588" />
            <path d="M19 3V7 M17 5 H21" stroke="#5B2588" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="text-2xl font-black tracking-wide uppercase text-[#5B2588]">HOGWORD</span>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl w-full max-w-[440px] p-10 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/60 animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-8">
            <h2 className="text-gray-500 text-xl font-normal mb-1">Welcome !</h2>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 leading-tight">
              Sign in or Sign up
            </h1>
            <p className="text-lg font-medium text-[#7C3AED]">
              Login to your account
            </p>
          </div>

          {/* INPUT FORM */}
          <div className="space-y-6 mb-10">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleEmailKeyDown}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white transition-all"
                placeholder="Enter your email"
                autoFocus
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handlePasswordKeyDown}
                  className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white transition-all"
                  placeholder="Enter your Password"
                  autoComplete="current-password"
                />

                {/* ปุ่ม toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pw-toggle-button absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* ปุ่ม Login */}
          <button
            onClick={handleAuthAction}
            disabled={loading}
            className="w-full bg-[#5B2588] text-white py-4 rounded-xl hover:bg-[#4a1d70] disabled:bg-gray-300 transition-all font-bold text-base shadow-lg shadow-purple-100"
          >
            {loading ? "Processing..." : "Login"}
          </button>
        </div>
      </main>
    </>
  );
}
