import { useState } from 'react'

/**
 * A password input with a Show/Hide toggle.
 *
 * FR-3.7 / FR-7.7: the toggle swaps the input's `type` between `password` and
 * `text`, and carries an `aria-label` naming the action plus `aria-pressed`
 * reflecting the current state.
 */
export default function PasswordField({
  id,
  testId,
  toggleTestId,
  wrapperTestId,
  value,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  hasError,
  describedBy,
}: {
  id: string
  testId: string
  toggleTestId: string
  /**
   * The artifact-family testid for the INPUT.
   *
   * An element can carry only one `data-testid`, but decision D6 requires
   * BOTH the app's family (`login-form-password-input`) and the artifact's
   * (`auth-signin-password-input`) to be emitted. The artifact's testid
   * therefore lives on a wrapper that encloses the input.
   */
  wrapperTestId?: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  placeholder: string
  autoComplete: string
  hasError: boolean
  describedBy: string
}) {
  const [shown, setShown] = useState(false)

  return (
    <div className="auth-field">
      <label className="auth-field-label" htmlFor={id}>
        Password
      </label>
      <div className="auth-input-wrap auth-pw-wrap" data-testid={wrapperTestId}>
        <input
          className={`auth-input${hasError ? ' has-error' : ''}`}
          id={id}
          name="password"
          type={shown ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-describedby={describedBy}
          aria-invalid={hasError ? 'true' : undefined}
          data-testid={testId}
        />
        <button
          className="auth-pw-toggle"
          type="button"
          aria-label={shown ? 'Hide password' : 'Show password'}
          aria-pressed={shown ? 'true' : 'false'}
          aria-controls={id}
          data-testid={toggleTestId}
          onClick={() => setShown((v) => !v)}
        >
          {shown ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  )
}
