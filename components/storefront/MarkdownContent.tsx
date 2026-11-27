import React from 'react'

interface MarkdownContentProps {
  content: string
}

function renderInline(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = []
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]
    if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push(<strong key={key++}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push(<em key={key++}>{token.slice(1, -1)}</em>)
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push(<code key={key++}>{token.slice(1, -1)}</code>)
    } else if (token.startsWith('[')) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)
      if (linkMatch) {
        const href = linkMatch[2]
        const safeHref =
          href.startsWith('http://') ||
          href.startsWith('https://') ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          href.startsWith('/')
            ? href
            : '#'
        tokens.push(
          <a key={key++} href={safeHref} rel="noopener noreferrer">
            {linkMatch[1]}
          </a>,
        )
      }
    }
    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex))
  }

  return tokens
}

/**
 * Safe, zero-XSS markdown renderer for /story and /contact CMS pages.
 */
export function MarkdownContent({ content }: MarkdownContentProps) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks: React.ReactNode[] = []
  let listItems: string[] = []
  let key = 0

  function flushList() {
    if (listItems.length > 0) {
      blocks.push(
        <ul key={`ul-${key++}`}>
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>,
      )
      listItems = []
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      flushList()
      continue
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2).trim())
      continue
    }

    flushList()

    if (line === '---' || line === '***') {
      blocks.push(<hr key={`hr-${key++}`} />)
    } else if (line.startsWith('### ')) {
      blocks.push(<h3 key={`h3-${key++}`}>{renderInline(line.slice(4))}</h3>)
    } else if (line.startsWith('## ')) {
      blocks.push(<h2 key={`h2-${key++}`}>{renderInline(line.slice(3))}</h2>)
    } else if (line.startsWith('# ')) {
      blocks.push(<h2 key={`h2-${key++}`}>{renderInline(line.slice(2))}</h2>)
    } else {
      blocks.push(<p key={`p-${key++}`}>{renderInline(line)}</p>)
    }
  }

  flushList()

  return <div className="mk-markdown">{blocks}</div>
}
