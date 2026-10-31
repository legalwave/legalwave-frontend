import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useSession } from '../../../app/providers'
import { ROUTES } from '../../../app/routes'
import AuthScreen from '../components/AuthScreen'
import { useAuthValidation, type AuthMode } from '../hooks/useAuthValidation'

/**
 * The create-account screen.
 *
 * Renders the shared `AuthScreen` in register mode. The tab set navigates to
 * `/login` (FR-5.3); the form itself still registers against the real backend
 * and navigates to the chat on success (FR-5.4).
 */
export default function RegisterPage() {
  const nav = useNavigate()
  const { signUp } = useSession()
  const validation = useAuthValidation()

  const [values, setValues] = useState<Record<string, string>>({
    'register-name': '',
    'register-email': '',
    'register-password': '',
  })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const setValue = useCallback((field: string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }, [])

  function selectMode(next: AuthMode) {
    if (next === 'register') return
    // FR-5.5 — switching modes resets the other mode's validation state.
    validation.clearMode('register')
    setNotice('')
    nav(ROUTES.LOGIN)
  }

  async function submit(_mode: AuthMode) {
    setErr('')
    setNotice('')

    // FR-4.9 / NFR-4.1 — validation runs before any request is issued.
    validation.armBlurValidation()
    if (!validation.validateAll('register')) return

    setBusy(true)
    try {
      const name = (values['register-name'] ?? '').trim()
      await signUp(
        values['register-email'] ?? '',
        values['register-password'] ?? '',
        name || undefined,
      )
      nav(ROUTES.CHAT, { replace: true })
    } catch (e) {
      // FR-5.6 — the server's message surfaces in the existing error element.
      setErr((e as Error).message)
    } finally {
      // NFR-4.7 — the busy flag is always cleared.
      setBusy(false)
    }
  }

  return (
    <AuthScreen
      mode="register"
      onSelectMode={selectMode}
      onSubmit={(m) => void submit(m)}
      busy={busy}
      serverError={err}
      notice={notice}
      values={values}
      setValue={setValue}
      errors={validation.errors}
      onBlur={(field) => validation.handleBlur(field, values[field] ?? '', 'register')}
      liveRegionRef={validation.liveRegionRef}
      submitLabel="Create account"
      busyLabel="Creating account…"
      onNotice={setNotice}
      crossLink={
        <>
          Already have an account?{' '}
          <Link className="auth-link" to={ROUTES.LOGIN} data-testid="register-form-login-link">
            Sign in
          </Link>
        </>
      }
    />
  )
}
