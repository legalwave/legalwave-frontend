import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useSession } from '../../../app/providers'
import { ROUTES } from '../../../app/routes'
import { BRAND } from '../../../config/brand'
import AuthScreen from '../components/AuthScreen'
import { useAuthValidation, type AuthMode } from '../hooks/useAuthValidation'

/**
 * The sign-in screen.
 *
 * Renders the shared `AuthScreen` in sign-in mode. The tab set navigates to
 * `/register` (FR-5.3); the form itself still authenticates against the real
 * backend and navigates to the chat on success (FR-5.4).
 */
export default function LoginPage() {
  const nav = useNavigate()
  const { signIn } = useSession()
  const validation = useAuthValidation()

  const [values, setValues] = useState<Record<string, string>>({
    'login-email': '',
    'login-password': '',
  })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const setValue = useCallback((field: string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }, [])

  function selectMode(next: AuthMode) {
    if (next === 'signin') return
    // FR-5.5 — switching modes resets the other mode's validation state, so a
    // stale error cannot appear in the newly selected form.
    validation.clearMode('signin')
    setNotice('')
    nav(ROUTES.REGISTER)
  }

  async function submit(_mode: AuthMode) {
    setErr('')
    setNotice('')

    // FR-4.9 / NFR-4.1 — validation runs before any request is issued, and the
    // handler re-runs it rather than trusting a pre-computed flag.
    validation.armBlurValidation()
    if (!validation.validateAll('signin')) return

    setBusy(true)
    try {
      await signIn(values['login-email'] ?? '', values['login-password'] ?? '')
      nav(ROUTES.CHAT, { replace: true })
    } catch (e) {
      // FR-5.6 — the server's message surfaces in the existing error element.
      setErr((e as Error).message)
    } finally {
      // NFR-4.7 — the busy flag is always cleared, so the form can never be
      // left in a partially-submitted state.
      setBusy(false)
    }
  }

  return (
    <AuthScreen
      mode="signin"
      onSelectMode={selectMode}
      onSubmit={(m) => void submit(m)}
      busy={busy}
      serverError={err}
      notice={notice}
      values={values}
      setValue={setValue}
      errors={validation.errors}
      onBlur={(field) => validation.handleBlur(field, values[field] ?? '', 'signin')}
      liveRegionRef={validation.liveRegionRef}
      submitLabel="Sign in"
      busyLabel="Signing in…"
      onNotice={setNotice}
      crossLink={
        <>
          New to {BRAND.name}?{' '}
          <Link
            className="auth-link"
            to={ROUTES.REGISTER}
            data-testid="login-form-register-link"
          >
            Create an account
          </Link>
        </>
      }
    />
  )
}
