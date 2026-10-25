import { useState } from "react";
import {
  loginAccount,
  registerAccount,
  requestPasswordReset,
  resetPassword,
} from "../services/accountApi";
import "./AccountPage.css";

export default function AccountPage({ resetToken, initialError, onBack, onAuthenticated, onPasswordReset }) {
  const [mode, setMode] = useState(resetToken ? "reset" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState(initialError || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setStatus("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");
    if (mode === "register" && password !== passwordConfirm) {
      setError("The passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (mode === "register" || mode === "login") {
        const account = mode === "register"
          ? await registerAccount({ email, password })
          : await loginAccount({ email, password });
        await onAuthenticated(account);
      } else if (mode === "forgot") {
        const result = await requestPasswordReset(email);
        setStatus(result.message);
      } else {
        const result = await resetPassword(resetToken, password);
        setStatus(result.message);
        onPasswordReset();
        setPassword("");
        setPasswordConfirm("");
        setMode("login");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "We could not complete that request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPasswordReset = mode === "reset" || mode === "forgot";
  const title = mode === "register"
    ? "Create your family account"
    : mode === "forgot"
      ? "Reset your password"
      : mode === "reset"
        ? "Choose a new password"
        : "Welcome back";

  return (
    <main className="account-shell">
      <header className="account-topbar">
        <button className="account-back" onClick={onBack}>← Back to library</button>
        <span className="account-brand"><span className="account-brand-mark">S</span> StoryWeaver</span>
        <span className="account-topbar-note">A reading space for every family</span>
      </header>
      <div className="account-layout">
        <section className="account-welcome">
          <p className="eyebrow">Read. Imagine. Grow.</p>
          <h1>Every young reader deserves a story of their own.</h1>
          <p>Create a parent account to manage child profiles, keep favourite stories, and collect young authors’ writing.</p>
          <div className="account-benefits">
            <span><i>✓</i> One secure family account</span>
            <span><i>✓</i> Separate spaces for each child</span>
            <span><i>✓</i> Password recovery by email</span>
          </div>
          <span className="account-illustration" aria-hidden="true">📚</span>
        </section>
        <section className="account-card" aria-labelledby="account-title">
          <div className="account-card-header">
            <p className="eyebrow">{mode === "register" ? "Get started" : isPasswordReset ? "Account assistance" : "Family account"}</p>
            <h2 id="account-title">{title}</h2>
            <p>{mode === "register" ? "Your account is for a parent or guardian." : mode === "login" ? "Sign in to open your child’s reading spaces." : "We’ll guide you through a secure password reset."}</p>
          </div>
          {mode === "login" || mode === "register" ? (
            <div className="account-tabs" role="tablist" aria-label="Account access">
              <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => changeMode("login")}>Sign in</button>
              <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => changeMode("register")}>Create account</button>
            </div>
          ) : null}
          <form className="account-form" onSubmit={submit}>
            {mode !== "reset" ? <>
              <label htmlFor="account-email">Email address</label>
              <input id="account-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={254} placeholder="you@example.com" required />
            </> : null}
            {mode !== "forgot" ? <>
              <label htmlFor="account-password">{mode === "reset" ? "New password" : "Password"}</label>
              <input id="account-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 1 : 12} maxLength={128} placeholder={mode === "login" ? "Enter your password" : "At least 12 characters"} required />
            </> : null}
            {mode === "register" || mode === "reset" ? <>
              <label htmlFor="account-password-confirm">Confirm password</label>
              <input id="account-password-confirm" type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} autoComplete="new-password" minLength={12} maxLength={128} placeholder="Enter your password again" required />
            </> : null}
            {mode === "register" ? <p className="account-privacy">By creating an account, you confirm that you are the parent or guardian managing these child profiles.</p> : null}
            {error ? <p className="account-message account-message--error" role="alert">{error}</p> : null}
            {status ? <p className="account-message" role="status">{status}</p> : null}
            <button className="account-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Please wait…" : mode === "register" ? "Create family account" : mode === "login" ? "Sign in" : mode === "forgot" ? "Send reset email" : "Save new password"}<span aria-hidden="true">→</span></button>
          </form>
          <div className="account-card-footer">
            {mode === "login" ? <button type="button" onClick={() => changeMode("forgot")}>Forgot password?</button> : null}
            {mode === "forgot" ? <button type="button" onClick={() => changeMode("login")}>Back to sign in</button> : null}
            {mode === "reset" ? <button type="button" onClick={() => changeMode("login")}>Back to sign in</button> : null}
          </div>
          <p className="account-data-note">Your child profiles and family reading data are available only after signing in to your account.</p>
        </section>
      </div>
      <footer className="account-footer">StoryWeaver <span>·</span> Made for shared reading</footer>
    </main>
  );
}
