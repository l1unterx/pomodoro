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
      <h1 className="text-2xl font-bold uppercase tracking-widest">Pomodoro</h1>

      <div className="flex w-full border border-foreground">
        <button
          onClick={() => setTab("login")}
          className={`flex-1 py-2 text-sm uppercase tracking-wide ${
            tab === "login" ? "bg-foreground text-background" : "hover:bg-foreground/10"
          }`}
        >
          Log in
        </button>
        <button
          onClick={() => setTab("register")}
          className={`flex-1 py-2 text-sm uppercase tracking-wide border-l border-foreground ${
            tab === "register" ? "bg-foreground text-background" : "hover:bg-foreground/10"
          }`}
        >
          Register
        </button>
      </div>

      {tab === "login" ? (
        <form action={loginFormAction} className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="login-username" className="text-sm">
              Username
            </label>
            <input
              id="login-username"
              name="username"
              type="text"
              required
              autoComplete="username"
              className="border border-foreground px-3 py-2 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="login-password" className="text-sm">
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="border border-foreground px-3 py-2 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loginPending}
            className="border border-foreground px-3 py-2 text-sm uppercase tracking-wide hover:bg-foreground hover:text-background disabled:hover:bg-transparent disabled:hover:text-foreground"
          >
            {loginPending ? "Logging in..." : "Log in"}
          </button>
        </form>
      ) : (
        <form action={registerFormAction} className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="register-username" className="text-sm">
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
              className="border border-foreground px-3 py-2 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="register-password" className="text-sm">
              Password
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="border border-foreground px-3 py-2 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={registerPending}
            className="border border-foreground px-3 py-2 text-sm uppercase tracking-wide hover:bg-foreground hover:text-background disabled:hover:bg-transparent disabled:hover:text-foreground"
          >
            {registerPending ? "Creating account..." : "Register"}
          </button>
        </form>
      )}

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
    </div>
  );
}
