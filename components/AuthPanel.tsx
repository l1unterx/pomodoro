"use client";

import { useActionState, useState } from "react";
import { loginAction, registerAction, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = { error: null };

export default function AuthPanel() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, initialState);
  const [registerState, registerFormAction, registerPending] = useActionState(
    registerAction,
    initialState,
  );

  const state = tab === "login" ? loginState : registerState;

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-sm flex-col items-center justify-center gap-8 px-4">
      <div className="flex flex-col items-center gap-1">
        <span className="h-3 w-3 rounded-full bg-accent shadow-lg shadow-accent/50" />
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Pomodoro</h1>
      </div>

      <div className="flex w-full gap-1 rounded-full bg-surface p-1">
        <button
          onClick={() => setTab("login")}
          className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
            tab === "login" ? "bg-accent text-background" : "text-muted hover:text-foreground"
          }`}
        >
          Log in
        </button>
        <button
          onClick={() => setTab("register")}
          className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
            tab === "register" ? "bg-accent text-background" : "text-muted hover:text-foreground"
          }`}
        >
          Register
        </button>
      </div>

      {tab === "login" ? (
        <form action={loginFormAction} className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="login-username" className="text-sm text-muted">
              Username
            </label>
            <input
              id="login-username"
              name="username"
              type="text"
              required
              autoComplete="username"
              className="rounded-xl border border-border bg-surface px-3 py-2.5 focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="login-password" className="text-sm text-muted">
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="rounded-xl border border-border bg-surface px-3 py-2.5 focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loginPending}
            className="rounded-full bg-accent py-2.5 text-sm font-semibold uppercase tracking-wide text-background shadow-lg shadow-accent/30 transition-transform hover:scale-105 disabled:hover:scale-100"
          >
            {loginPending ? "Logging in..." : "Log in"}
          </button>
        </form>
      ) : (
        <form action={registerFormAction} className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="register-username" className="text-sm text-muted">
              Username
            </label>
            <input
              id="register-username"
              name="username"
              type="text"
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              autoComplete="username"
              className="rounded-xl border border-border bg-surface px-3 py-2.5 focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="register-password" className="text-sm text-muted">
              Password
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="rounded-xl border border-border bg-surface px-3 py-2.5 focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={registerPending}
            className="rounded-full bg-accent py-2.5 text-sm font-semibold uppercase tracking-wide text-background shadow-lg shadow-accent/30 transition-transform hover:scale-105 disabled:hover:scale-100"
          >
            {registerPending ? "Creating account..." : "Register"}
          </button>
        </form>
      )}

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
    </div>
  );
}
