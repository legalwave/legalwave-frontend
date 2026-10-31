import type { ReactNode } from 'react'
import { BRAND, DISCLAIMER } from '../../../config/brand'
import AuthArtwork from './AuthArtwork'
import AuthNotice from './AuthNotice'
import AuthTabs from './AuthTabs'
import GoogleButton from './GoogleButton'
import PasswordField from './PasswordField'
import type { AuthMode } from '../hooks/useAuthValidation'

/**
 * The shared two-panel shell for the sign-in and create-account screens.
 *
 * Both routes render this component; only the active mode and the form
 * contents differ (FR-5.1, FR-5.2).
 *
 * The two `data-testid` families coexist by construction: the app's existing
 * testids always win on the element that already carried them, and the
 * source artifact's testids are applied to the elements that did not
 * previously exist (the tabs, the password toggles, the Google buttons). An
 * element carries exactly one `data-testid` — see FR-8.1, FR-8.2.
 */

export interface AuthScreenProps {
  mode: AuthMode
  /** Called when a tab is activated — the caller navigates to that route. */
  onSelectMode: (mode: AuthMode) => void
  /** Called on submit with the mode's current values. */
  onSubmit: (mode: AuthMode) => void
  busy: boolean
  /** The server's error message, if the last request failed. */
  serverError: string
  /** The inline notice raised by the demo-only controls. */
  notice: string
  /** Field values, keyed by element id. */
  values: Record<string, string>
  /** Set a field's value. */
  setValue: (field: string, value: string) => void
  /** The per-field error messages. */
  errors: Record<string, string>
  /** Re-validate a field on blur. */
  onBlur: (field: string) => void
  /** The live region ref for the announcements. */
  liveRegionRef: React.RefObject<HTMLDivElement | null>
  /** The mode-specific submit label. */
  submitLabel: string
  /** The mode-specific busy label. */
  busyLabel: string
  /** The cross-link to the other mode. */
  crossLink: ReactNode
  /** The demo-only controls' notice handler. */
  onNotice: (message: string) => void
}

export default function AuthScreen({
  mode,
  onSelectMode,
  onSubmit,
  busy,
  serverError,
  notice,
  values,
  setValue,
  errors,
  onBlur,
  liveRegionRef,
  submitLabel,
  busyLabel,
  crossLink,
  onNotice,
}: AuthScreenProps) {
  const isSignIn = mode === 'signin'

  function errorFor(field: string): string {
    return errors[field] ?? ''
  }

  return (
    // FR-8.1 — the `auth-card` testid was on the old centred-card shell. The
    // shell is now the two-panel screen, so the testid moves here to keep the
    // existing automation contract alive (decision D6).
    <div className="auth-page" data-testid="auth-card">
      <AuthArtwork />

      <main className="auth-form-panel" data-testid="auth-form-panel">
        <div className="auth-form-inner" id="form-region">
          <AuthTabs mode={mode} onSelect={onSelectMode} />

          {/* FR-4.3 — validation errors are announced here. */}
          <div
            className="auth-visually-hidden"
            id="live-region"
            role="status"
            aria-live="polite"
            ref={liveRegionRef}
          />

          {/* ---------------- Sign-in panel ---------------- */}
          <section
            role="tabpanel"
            id="panel-signin"
            aria-labelledby="tab-signin"
            tabIndex={0}
            hidden={!isSignIn}
          >
            <h1 className="auth-form-heading">Welcome back</h1>
            <p className="auth-form-subtext">Sign in to review your contracts and chats.</p>

            {/* FR-8.2 / D6 — the artifact's form testid rides on a wrapper
                around the form, so the app's `login-form` testid stays on
                the <form> itself. An element can carry only one testid, so
                the two families are emitted on nested elements. */}
            <div data-testid="auth-signin-form">
              <form
                id="form-signin"
                noValidate
                data-testid="login-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  onSubmit('signin')
                }}
              >
              <div className="auth-field">
                <label className="auth-field-label" htmlFor="login-email">
                  Email or username
                </label>
                <div data-testid="auth-signin-identifier-input">
                  <input
                    className={`auth-input${errorFor('login-email') ? ' has-error' : ''}`}
                    id="login-email"
                    name="email"
                    type="text"
                    autoComplete="username"
                    placeholder="you@example.com or your username"
                    value={values['login-email'] ?? ''}
                    onChange={(e) => setValue('login-email', e.target.value)}
                    onBlur={() => onBlur('login-email')}
                    aria-describedby="login-email-error"
                    aria-invalid={errorFor('login-email') ? 'true' : undefined}
                    data-testid="login-form-email-input"
                  />
                </div>
                <p
                  className={`auth-field-error${errorFor('login-email') ? ' is-visible' : ''}`}
                  id="login-email-error"
                  aria-hidden={errorFor('login-email') ? 'false' : 'true'}
                >
                  {errorFor('login-email')}
                </p>
              </div>

              <PasswordField
                id="login-password"
                testId="login-form-password-input"
                toggleTestId="auth-signin-password-toggle"
                wrapperTestId="auth-signin-password-input"
                value={values['login-password'] ?? ''}
                onChange={(v) => setValue('login-password', v)}
                onBlur={() => onBlur('login-password')}
                placeholder="Your password"
                autoComplete="current-password"
                hasError={!!errorFor('login-password')}
                describedBy="login-password-error"
              />
              <p
                className={`auth-field-error${errorFor('login-password') ? ' is-visible' : ''}`}
                id="login-password-error"
                aria-hidden={errorFor('login-password') ? 'false' : 'true'}
              >
                {errorFor('login-password')}
              </p>

              <div className="auth-form-row">
                <button
                  className="auth-link"
                  type="button"
                  data-testid="auth-forgot-password-button"
                  onClick={() => onNotice('Password reset is not connected in this prototype.')}
                >
                  Forgot password?
                </button>
              </div>

              {serverError && (
                <p className="auth-field-error is-visible" data-testid="login-form-error" role="alert">
                  {serverError}
                </p>
              )}

                <div data-testid="auth-signin-submit-button">
                  <button
                    className="auth-btn auth-btn-primary"
                    type="submit"
                    data-testid="login-form-submit-button"
                    disabled={busy}
                  >
                    {busy ? busyLabel : submitLabel}
                  </button>
                </div>
              </form>
            </div>

            <div className="auth-divider" aria-hidden="true">
              or
            </div>

            <GoogleButton
              testId="auth-google-button"
              onClick={() => onNotice('Google sign-in is not connected in this prototype.')}
            />
            <AuthNotice id="signin-notice" message={notice} />

            <p className="auth-disclaimer">{DISCLAIMER}</p>
          </section>

          {/* ---------------- Create-account panel ---------------- */}
          <section
            role="tabpanel"
            id="panel-register"
            aria-labelledby="tab-register"
            tabIndex={0}
            hidden={isSignIn}
          >
            <h1 className="auth-form-heading">Create your account</h1>
            <p className="auth-form-subtext">
              Start checking contracts against Japanese statutes.
            </p>

            <div data-testid="auth-register-form">
              <form
                id="form-register"
                noValidate
                data-testid="register-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  onSubmit('register')
                }}
              >
              <div className="auth-field">
                <label className="auth-field-label" htmlFor="register-name">
                  Full name
                </label>
                <div data-testid="auth-register-name-input">
                  <input
                    className={`auth-input${errorFor('register-name') ? ' has-error' : ''}`}
                    id="register-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Aiko Tanaka"
                    value={values['register-name'] ?? ''}
                    onChange={(e) => setValue('register-name', e.target.value)}
                    onBlur={() => onBlur('register-name')}
                    aria-describedby="register-name-error"
                    aria-invalid={errorFor('register-name') ? 'true' : undefined}
                    data-testid="register-form-name-input"
                  />
                </div>
                <p
                  className={`auth-field-error${errorFor('register-name') ? ' is-visible' : ''}`}
                  id="register-name-error"
                  aria-hidden={errorFor('register-name') ? 'false' : 'true'}
                >
                  {errorFor('register-name')}
                </p>
              </div>

              <div className="auth-field">
                <label className="auth-field-label" htmlFor="register-email">
                  Email
                </label>
                <div data-testid="auth-register-email-input">
                  <input
                    className={`auth-input${errorFor('register-email') ? ' has-error' : ''}`}
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={values['register-email'] ?? ''}
                    onChange={(e) => setValue('register-email', e.target.value)}
                    onBlur={() => onBlur('register-email')}
                    aria-describedby="register-email-error"
                    aria-invalid={errorFor('register-email') ? 'true' : undefined}
                    data-testid="register-form-email-input"
                  />
                </div>
                <p
                  className={`auth-field-error${errorFor('register-email') ? ' is-visible' : ''}`}
                  id="register-email-error"
                  aria-hidden={errorFor('register-email') ? 'false' : 'true'}
                >
                  {errorFor('register-email')}
                </p>
              </div>

              <PasswordField
                id="register-password"
                testId="register-form-password-input"
                toggleTestId="auth-register-password-toggle"
                wrapperTestId="auth-register-password-input"
                value={values['register-password'] ?? ''}
                onChange={(v) => setValue('register-password', v)}
                onBlur={() => onBlur('register-password')}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                hasError={!!errorFor('register-password')}
                describedBy="register-password-error"
              />
              <p
                className={`auth-field-error${errorFor('register-password') ? ' is-visible' : ''}`}
                id="register-password-error"
                aria-hidden={errorFor('register-password') ? 'false' : 'true'}
              >
                {errorFor('register-password')}
              </p>

              {serverError && (
                <p className="auth-field-error is-visible" data-testid="register-form-error" role="alert">
                  {serverError}
                </p>
              )}

                <div data-testid="auth-register-submit-button">
                  <button
                    className="auth-btn auth-btn-primary"
                    type="submit"
                    data-testid="register-form-submit-button"
                    disabled={busy}
                  >
                    {busy ? busyLabel : submitLabel}
                  </button>
                </div>
              </form>
            </div>

            <div className="auth-divider" aria-hidden="true">
              or
            </div>

            <GoogleButton
              testId="auth-google-register-button"
              onClick={() => onNotice('Google sign-in is not connected in this prototype.')}
            />
            <AuthNotice id="register-notice" message={notice} />

            <p className="auth-disclaimer">{DISCLAIMER}</p>
          </section>

          {/* The cross-link to the other mode. */}
          <p className="auth-disclaimer" style={{ marginTop: 18 }}>
            {crossLink}
          </p>
          <p className="auth-visually-hidden">{BRAND.name} authentication</p>
        </div>
      </main>
    </div>
  )
}
