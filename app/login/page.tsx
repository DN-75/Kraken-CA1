"use client";
import {useState, type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {
    IoEyeOutline,
    IoEyeOffOutline,
    IoMailOutline,
    IoLockClosedOutline,
} from "react-icons/io5";
import {supabase} from "@/lib/supabaseClient";

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setAuthError(null);
        setIsSubmitting(true);

        try {
            const {data, error} = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });
            // console.log(data.user);

            if (error || !data?.user) {
                setAuthError(error?.message || "Login failed")
                return
            }
            const {data: profile, error: profileError} = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single()
            // console.log(profile);
            if (profileError || !profile) {
                console.error(profileError)
                setAuthError("Could not fetch user role")
                return
            }
            if (profile) {
                if (profile.role === "admin") {
                    router.push("/")
                } else if (profile.role === "user") {
                    router.push("/")
                } else if (profile.role === "professional") {
                    router.push("/")
                }

            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 relative"
            style={{
                background:
                    "linear-gradient(0deg, #022C22 0%, #087B5A 50%, #022C22 100%)",
            }}
            //main tile
        >
            {/* Login Card */}
            <div
                className="w-full max-w-[420px] rounded-2xl p-8 sm:p-10"
                style={{
                    background: "rgba(17, 49, 39, 0.40)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(16, 185, 129, 0.15)",
                    boxShadow:
                        "0 25px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(16, 185, 129, 0.05)",

                }}
            >
                {/* Logo */}
                <div className="flex items-center justify-center gap-2.5 mb-8">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{backgroundColor: "#10B981"}}
                    >
                        <svg
                            className="w-6 h-6 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <circle cx="12" cy="8" r="2.5"/>
                            <circle cx="7" cy="13" r="2.5"/>
                            <circle cx="17" cy="13" r="2.5"/>
                            <circle cx="12" cy="18" r="2.5"/>
                            <circle cx="7" cy="8" r="1.5" opacity="0.6"/>
                            <circle cx="17" cy="8" r="1.5" opacity="0.6"/>
                        </svg>
                    </div>
                    <span className="text-white text-xl font-bold tracking-tight">
            ExpertConnect
          </span>
                </div>

                {/* Heading */}
                <h1 className="text-3xl font-bold text-center text-white mb-2">
                    Welcome Back
                </h1>
                <p className="text-center text-sm mb-8" style={{color: "#649c8c"}}>
                    Log in to continue your mentorship journey
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div>
                        <label
                            className="block text-xs font-semibold tracking-widest uppercase mb-2"
                            style={{color: "#10B981"}}
                        >
                            Email Address
                        </label>
                        <div className="relative">
                            <IoMailOutline
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10"
                                size={18}
                                style={{color: "#649c8c"}}
                            />

                            {/* Gradient border wrapper */}
                            <div
                                className="rounded-full p-[1.5px]"
                                style={{
                                    background: 'rgba(255,255,255,0.3))'
                                }}
                            >
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    className="w-full pl-11 pr-4 py-3 rounded-full text-sm text-white placeholder-[#649c8c] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(2,44,34,0.45), rgba(2,34,24,0.35))',
                                        backdropFilter: 'blur(12px)',
                                        WebkitBackdropFilter: 'blur(12px)',
                                        boxShadow: 'inset 0 0px 1.5px rgba(255,255,255,0.3),inset 0.3px 0.5px 1px rgba(255,255,255,0.35), 0 4px 5px rgba(0,0,0,0.2)'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label
                                className="block text-xs font-semibold tracking-widest uppercase"
                                style={{color: "#10B981"}}
                            >
                                Password
                            </label>
                            <Link
                                href="#"
                                className="text-xs font-medium hover:underline"
                                style={{color: "#10B981"}}
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <IoLockClosedOutline
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10"
                                size={18}
                                style={{color: "#649c8c"}}
                            />

                            {/* Gradient border wrapper */}
                            <div
                                className="rounded-full p-[1.5px]"
                                style={{
                                    background: 'rgba(255,255,255,0.3))'
                                }}
                            >
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    className="w-full pl-11 pr-11 py-3 rounded-full text-sm text-white placeholder-[#649c8c] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(2,44,34,0.45), rgba(2,34,24,0.35))',
                                        backdropFilter: 'blur(12px)',
                                        WebkitBackdropFilter: 'blur(12px)',
                                        boxShadow: 'inset 0 0px 1.5px rgba(255,255,255,0.3),inset 0.5px 0.5px 1px rgba(255,255,255,0.35), 0 4px 5px rgba(0,0,0,0.2)'
                                    }}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer z-10"
                                style={{color: "#649c8c"}}
                            >
                                {showPassword ? (
                                    <IoEyeOffOutline size={18}/>
                                ) : (
                                    <IoEyeOutline size={18}/>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Log In Button */}
                    {authError ? (
                        <p className="text-sm text-center text-red-300">{authError}</p>
                    ) : null}
                    <div
                        className="p-[1px] rounded-full w-full"
                        style={{background: "rgba(28,196,133,0.1)"}}
                    >
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 text-white font-semibold rounded-full transition-all text-sm cursor-pointer hover:brightness-110 active:scale-[0.98]"
                            style={{
                                background: 'linear-gradient(135deg, rgba(28,196,133,0.45), rgba(20,150,100,0.45))',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                boxShadow: 'inset 0 0 0 0.5px rgba(152,255,152,0.25), inset 0 1px 2px rgba(255,255,255,0.35), 0 6px 16px rgba(0,0,0,0.25)'
                            }}
                        >
                            {isSubmitting ? "Logging in..." : "Log In"}
                        </button>
                    </div>
                </form>


                {/* Footer - Create Account */}
                <p className="text-center text-sm mt-8" style={{color: "#649c8c"}}>
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/register"
                        className="font-semibold hover:underline"
                        style={{color: "#10B981"}}
                    >
                        Create an Account
                    </Link>
                </p>
            </div>

            {/* Copyright Footer */}
            <p
                className="absolute bottom-6 text-xs text-center"
                style={{color: "rgba(100, 156, 140, 0.6)"}}
            >
                © 2024 ExpertConnect. All rights reserved. Secure Cloud Mentorship.
            </p>
        </div>
    );
}
