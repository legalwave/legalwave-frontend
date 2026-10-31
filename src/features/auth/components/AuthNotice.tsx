/**
 * The inline notice region (FR-3.10, FR-3.11).
 *
 * It carries `role="status"` and `aria-live="polite"`, and paints only when a
 * message is present — so a control never appears to do nothing (FR-3.10).
 */
export default function AuthNotice({
  id,
  message,
}: {
  id: string
  message: string
}) {
  return (
    <div
      className={`auth-notice${message ? ' is-visible' : ''}`}
      id={id}
      role="status"
      aria-live="polite"
      data-testid={id}
    >
      {message}
    </div>
  )
}
