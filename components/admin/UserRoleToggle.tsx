'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UserRoleToggleProps {
  userId: string
  userEmail: string
  currentRole: string
  isSelf: boolean
}

export function UserRoleToggle({
  userId,
  userEmail,
  currentRole,
  isSelf,
}: UserRoleToggleProps) {
  const router = useRouter()
  const [role, setRole] = useState(currentRole)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const nextRole = role === 'admin' ? 'customer' : 'admin'

  async function handleToggle() {
    if (isSelf) return
    setBusy(true)
    setError('')
    setNotice('')

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      })
      const data = (await res.json()) as { error?: string; profile?: { role: string } }
      if (!res.ok) {
        setError(data.error || 'Could not update role.')
        return
      }
      setRole(data.profile?.role ?? nextRole)
      setNotice(`Updated ${userEmail} to ${nextRole}.`)
      router.refresh()
    } catch {
      setError('Network error while updating role.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 border-t border-[#ecece8] pt-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#6a6a6a]">
            Account Role
          </p>
          <p className="mt-1 text-sm font-bold uppercase text-[#030304]">{role}</p>
        </div>

        <button
          type="button"
          disabled={isSelf || busy}
          onClick={handleToggle}
          className="border border-[#030304] bg-[#030304] px-4 py-2 text-xs font-medium uppercase tracking-[0.06em] text-white hover:bg-[#1f1f22] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy
            ? 'Updating…'
            : role === 'admin'
              ? 'Demote to Customer'
              : 'Promote to Admin'}
        </button>
      </div>

      {isSelf ? (
        <p className="text-xs text-[#757575]">
          You cannot change your own role to prevent accidental admin lockout.
        </p>
      ) : null}
      {error ? <p className="text-xs text-[#ff5331]">{error}</p> : null}
      {notice ? <p className="text-xs text-emerald-700">{notice}</p> : null}
    </div>
  )
}
