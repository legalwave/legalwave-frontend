import { useCallback, useRef, useState } from 'react'

/**
 * The shared validation rule set for both auth modes.
 *
 * Ported from `context-docs/mockups/08-responsive-login-register.html`, whose
 * `validateField` was verified by the source unit's 313-check suite.
 *
 * The mode-specific differences are expressed as data (NFR-5.5) rather than
 * as two parallel implementations — the register mode adds a name field and
 * tightens the identifier to email-only and the password to a minimum length.
 *
 * Requirements: FR-4.1 … FR-4.9, NFR-4.1, NFR-4.4, NFR-1.3.
 */

export type AuthMode = 'signin' | 'register'

/** The fields each mode validates, in DOM order. */
export const MODE_FIELDS: Record<AuthMode, string[]> = {
  signin: ['login-email', 'login-password'],
  register: ['register-name', 'register-email', 'register-password'],
}

/** An email address. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
/** A username: at least 3 letters, numbers, dots, dashes or underscores. */
const USERNAME_RE = /^[A-Za-z0-9._-]{3,}$/

export function looksLikeEmail(value: string): boolean {
  return EMAIL_RE.test(value)
}

export function looksLikeUsername(value: string): boolean {
  return USERNAME_RE.test(value)
}

/**
 * Validate one field of one mode.
 *
 * Returns the plain-language message to show, or `null` when the value is
 * acceptable (FR-4.2 — the message states what is wrong AND how to fix it).
 */
export function validateField(field: string, rawValue: string, mode: AuthMode): string | null {
  const value = rawValue.trim()

  if (mode === 'signin') {
    if (field === 'login-email') {
      if (!value) {
        return 'Enter your email address or username to continue.'
      }
      // FR-4.5 — sign-in accepts either an email address or a username.
      if (!looksLikeEmail(value) && !looksLikeUsername(value)) {
        return 'Enter a valid email address, or a username of at least 3 letters, numbers, dots, dashes or underscores.'
      }
    }
    if (field === 'login-password') {
      if (!value) {
        return 'Enter your password to continue.'
      }
      // FR-4.6 — no length rule on sign-in. The failure belongs in
      // authentication, not in client-side validation.
    }
    return null
  }

  // register mode
  if (field === 'register-name') {
    if (!value) {
      return 'Enter your full name so your account can be identified.'
    }
  }
  if (field === 'register-email') {
    if (!value) {
      return 'Enter your email address so we can reach you.'
    }
    if (!looksLikeEmail(value)) {
      return 'Enter a valid email address, for example name@example.com.'
    }
  }
  if (field === 'register-password') {
    if (!value) {
      return 'Enter a password to create your account.'
    }
    if (value.length < 8) {
      // FR-4.6 / NFR-4.4 — the registration password minimum.
      return 'Use at least 8 characters for your password.'
    }
  }
  return null
}

export interface AuthValidation {
  /** The current error message per field id. A field with no entry has no error. */
  errors: Record<string, string>
  /** Whether a submit has been attempted — blur re-validation only runs after this (FR-4.1). */
  submitted: boolean
  /** Validate every field of a mode. Returns false when anything failed. */
  validateAll: (mode: AuthMode) => boolean
  /** Re-validate a single field (FR-4.1). A no-op before the first submit. */
  handleBlur: (field: string, value: string, mode: AuthMode) => void
  /** Set or clear one field's error. */
  setError: (field: string, message: string | null) => void
  /** Clear every error for a mode (FR-5.5). */
  clearMode: (mode: AuthMode) => void
  /** Clear every error, in both modes. */
  clearAll: () => void
  /** Mark that a submit has happened, so blur re-validation arms (FR-4.1). */
  armBlurValidation: () => void
  /** Write a message to the aria-live region (FR-4.3, NFR-1.3). */
  announce: (message: string) => void
  /** Ref for the aria-live element. */
  liveRegionRef: React.RefObject<HTMLDivElement | null>
}

/**
 * The validation hook shared by the sign-in and create-account forms.
 */
export function useAuthValidation(): AuthValidation {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const liveRegionRef = useRef<HTMLDivElement | null>(null)

  const setError = useCallback((field: string, message: string | null) => {
    setErrors((prev) => {
      if (message === null) {
        if (!(field in prev)) return prev
        const next = { ...prev }
        delete next[field]
        return next
      }
      if (prev[field] === message) return prev
      return { ...prev, [field]: message }
    })
  }, [])

  const announce = useCallback((message: string) => {
    const region = liveRegionRef.current
    if (!region) return
    // Clear first so repeated identical messages are still announced (FR-4.3).
    region.textContent = ''
    window.setTimeout(() => {
      region.textContent = message
    }, 40)
  }, [liveRegionRef])

  const validateAll = useCallback(
    (mode: AuthMode): boolean => {
      // FR-4.9 — the submit handler re-runs the full validation rather than
      // trusting a pre-computed flag, so the check cannot be bypassed.
      let firstBad: string | null = null
      let errorCount = 0

      for (const field of MODE_FIELDS[mode]) {
        const el = document.getElementById(field) as HTMLInputElement | null
        const value = el ? el.value : ''
        const message = validateField(field, value, mode)
        if (message) {
          errorCount += 1
          if (firstBad === null) firstBad = field
          setError(field, message)
        } else {
          setError(field, null)
        }
      }

      if (errorCount > 0) {
        announce(
          errorCount === 1
            ? 'There is 1 problem with the form. Please correct it.'
            : `There are ${errorCount} problems with the form. Please correct them.`,
        )
        if (firstBad !== null) {
          const el = document.getElementById(firstBad)
          if (el) el.focus()
        }
        return false
      }
      return true
    },
    [setError, announce],
  )

  const handleBlur = useCallback(
    (field: string, value: string, mode: AuthMode) => {
      // FR-4.1 — validate on submit, then re-validate on blur so a corrected
      // field clears its error without a second submit.
      if (!submitted) return
      const message = validateField(field, value, mode)
      setError(field, message)
    },
    [submitted, setError],
  )

  const clearMode = useCallback(
    (mode: AuthMode) => {
      for (const field of MODE_FIELDS[mode]) setError(field, null)
    },
    [setError],
  )

  const clearAll = useCallback(() => {
    setErrors({})
    setSubmitted(false)
  }, [])

  const armBlurValidation = useCallback(() => setSubmitted(true), [])

  return {
    errors,
    submitted,
    validateAll,
    handleBlur,
    setError,
    clearMode,
    clearAll,
    armBlurValidation,
    announce,
    liveRegionRef,
  }
}
