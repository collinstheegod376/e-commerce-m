'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { MarkdownContent } from '@/components/storefront/MarkdownContent'

interface PageRecord {
  slug: 'story' | 'contact'
  title: string
  content: string
  updatedAt: string | null
}

interface ContentEditorsClientProps {
  story: PageRecord
  contact: PageRecord
}

function SinglePageEditor({ initial }: { initial: PageRecord }) {
  const [title, setTitle] = useState(initial.title)
  const [content, setContent] = useState(initial.content)
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setNotice('')
    setError('')

    try {
      const res = await fetch(`/api/admin/pages/${initial.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error || 'Could not save page.')
        return
      }
      setNotice(`Saved /${initial.slug} — live immediately on the storefront.`)
    } catch {
      setError('Network error saving page.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="border border-[#e2e2de] bg-white p-6 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase text-[#6a6a6a]">
            /{initial.slug}
          </p>
          <h2 className="text-lg font-bold tracking-[-0.03em]">
            {initial.slug === 'story' ? 'Story Page' : 'Contact Page'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="border border-[#d6d6d6] px-3 py-1.5 text-xs hover:border-[#030304]"
          >
            {preview ? 'Edit Markdown' : 'Preview'}
          </button>
          <Link
            href={`/${initial.slug}`}
            className="text-xs text-[#6a6a6a] underline underline-offset-4 hover:text-[#030304]"
          >
            View live →
          </Link>
        </div>
      </div>

      <label className="block">
        <span className="block text-[11px] uppercase tracking-[0.06em] text-[#6a6a6a]">
          Page Title
        </span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1.5 w-full border border-[#d6d6d6] px-3 py-2 text-xs outline-none focus:border-[#030304]"
        />
      </label>

      {preview ? (
        <div className="min-h-[260px] border border-[#e2e2de] bg-[#fafaf8] p-5">
          <MarkdownContent content={content} />
        </div>
      ) : (
        <label className="block">
          <span className="block text-[11px] uppercase tracking-[0.06em] text-[#6a6a6a]">
            Markdown Content
          </span>
          <textarea
            required
            rows={14}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1.5 w-full border border-[#d6d6d6] px-3 py-2 font-mono text-xs leading-relaxed outline-none focus:border-[#030304]"
          />
        </label>
      )}

      {error ? <p className="text-xs text-[#ff5331]">{error}</p> : null}
      {notice ? <p className="text-xs text-emerald-700">{notice}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="bg-[#030304] px-5 py-2.5 text-xs font-medium uppercase tracking-[0.06em] text-white hover:bg-[#1f1f22] disabled:opacity-50"
      >
        {saving ? 'Saving…' : `Save /${initial.slug}`}
      </button>
    </form>
  )
}

export function ContentEditorsClient({ story, contact }: ContentEditorsClientProps) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <SinglePageEditor initial={story} />
      <SinglePageEditor initial={contact} />
    </div>
  )
}
