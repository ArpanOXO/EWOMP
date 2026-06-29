import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { TextField } from "../components/ui/FormField";
import { Button } from "../components/ui/Button";
import { isAppwriteConfigured } from "../lib/appwrite";

const schema = yup.object({
  email: yup.string().email("Enter a valid email").required("Email is required"),
  password: yup.string().required("Password is required"),
});

type FormValues = yup.InferType<typeof schema>;

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: yupResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await login(values.email, values.password);
      navigate("/", { replace: true });
    } catch {
      setServerError(useAuthStore.getState().error ?? "Couldn't sign in. Check your email and password.");
    }
  }

  // return (
  //   <div className="flex min-h-screen items-center justify-center bg-(--color-ink) px-4">
  //     <div className="w-full max-w-sm">
  //       <div className="mb-8 flex flex-col items-center text-center">
  //         <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-(--color-accent) font-(family-name:--font-display) text-lg font-semibold text-white">
  //           E
  //         </span>
  //         <h1 className="mt-4 font-(family-name:--font-display) text-2xl font-semibold text-white">EWOMP</h1>
  //         <p className="mt-1 text-sm text-white/55">Enterprise Workforce &amp; Organization Management</p>
  //       </div>

  //       <div className="rounded-2xl border border-white/10 bg-(--color-surface) p-6 shadow-xl">
  //         {!isAppwriteConfigured && (
  //           <div className="mb-4 rounded-md border border-(--color-amber) bg-(--color-amber-soft) px-3 py-2 text-xs text-(--color-amber)">
  //             Appwrite isn't configured yet — copy <code>.env.example</code> to <code>.env</code> and fill in your
  //             project details. See README.md.
  //           </div>
  //         )}
  //         <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
  //           <TextField
  //             label="Email"
  //             type="email"
  //             placeholder="you@company.com"
  //             error={errors.email?.message}
  //             {...register("email")}
  //           />
  //           <TextField
  //             label="Password"
  //             type="password"
  //             placeholder="••••••••"
  //             error={errors.password?.message}
  //             {...register("password")}
  //           />
  //           {serverError && (
  //             <p className="rounded-md bg-(--color-danger-soft) px-3 py-2 text-sm text-(--color-danger)">
  //               {serverError}
  //             </p>
  //           )}
  //           <Button type="submit" className="w-full" loading={isSubmitting}>
  //             Sign in
  //           </Button>
  //         </form>
  //       </div>
  //       <p className="mt-6 text-center text-xs text-white/40">
  //         Accounts are created by an administrator — there's no public sign-up.
  //       </p>
  //     </div>
  //   </div>
  // );
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background Glow */}
      <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
        <div className="grid w-full items-center gap-16 lg:grid-cols-2">
          {/* Left Side */}
          <div className="hidden lg:block">
            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
              Enterprise HR Platform
            </span>

            <h1 className="mt-8 text-6xl font-bold leading-tight text-white">
              Enterprise
              <br />
              Workforce
              <br />
              Management
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">
              A centralized platform for managing employees,
              departments, attendance, payroll, leave requests,
              and organizational workflows.
            </p>

            <div className="mt-12 flex gap-8">
              <div>
                <h3 className="text-3xl font-bold text-white">500+</h3>
                <p className="text-slate-400">Employees</p>
              </div>

              <div>
                <h3 className="text-3xl font-bold text-white">25+</h3>
                <p className="text-slate-400">Departments</p>
              </div>

              <div>
                <h3 className="text-3xl font-bold text-white">99.9%</h3>
                <p className="text-slate-400">Secure</p>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
              {/* Logo */}
              <div className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30">
                  <span className="text-2xl font-bold text-white">E</span>
                </div>

                <h2 className="mt-6 text-3xl font-bold text-white">
                  Welcome Back
                </h2>

                <p className="mt-2 text-center text-slate-400">
                  Sign in to continue to your workspace.
                </p>
              </div>

              {!isAppwriteConfigured && (
                <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-300">
                  Appwrite is not configured. Please update your
                  <code className="mx-1 rounded bg-black/20 px-1">
                    .env
                  </code>
                  file.
                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-8 space-y-5"
              >
                <TextField
                  label="Email Address"
                  type="email"
                  placeholder="you@company.com"
                  error={errors.email?.message}
                  {...register("email")}
                />

                <TextField
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register("password")}
                />

                {serverError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                    {serverError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-base font-semibold transition-all hover:from-blue-500 hover:to-cyan-400"
                  loading={isSubmitting}
                >
                  Sign In
                </Button>
              </form>

              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-center text-sm text-slate-400">
                  Accounts are created and managed by your
                  organization's administrator.
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
              © {new Date().getFullYear()} EWOMP • Enterprise Workforce &
              Organization Management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
