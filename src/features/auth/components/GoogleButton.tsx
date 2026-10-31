/**
 * The "Continue with Google" outline button (FR-3.9).
 *
 * Google sign-in is not connected in this prototype, so clicking the button
 * raises an inline notice rather than silently doing nothing (FR-3.10).
 */
export default function GoogleButton({
  testId,
  onClick,
}: {
  testId: string
  onClick: () => void
}) {
  return (
    <button className="auth-btn auth-btn-outline" type="button" data-testid={testId} onClick={onClick}>
      <svg className="auth-google-mark" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H1v2.34A9 9 0 0 0 9 18Z"
        />
        <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H1a9 9 0 0 0 0 8.12l2.97-2.34Z" />
        <path
          fill="#EA4335"
          d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 1 4.94l2.97 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
        />
      </svg>
      <span>Continue with Google</span>
    </button>
  )
}
