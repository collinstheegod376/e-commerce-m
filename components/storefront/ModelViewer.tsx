'use client'

import { useEffect, useState } from 'react'

interface ModelViewerProps {
  src: string
  poster?: string
  alt: string
  className?: string
}

export function ModelViewer({ src, poster, alt, className }: ModelViewerProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    import('@google/model-viewer')
      .then(() => {
        if (active) setReady(true)
      })
      .catch((err) => {
        console.error('[model-viewer] Failed to load 3D viewer:', err)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div
      className={className ?? 'hero-image hero-3d'}
      aria-label={`Interactive 3D view of ${alt}`}
    >
      {ready ? (
        <model-viewer
          key={src}
          src={src}
          poster={poster}
          alt={alt}
          camera-controls
          auto-rotate
          auto-rotate-delay="1500"
          rotation-per-second="18deg"
          tone-mapping="neutral"
          camera-orbit="0deg 86deg 105%"
          min-camera-orbit="auto auto 55%"
          max-camera-orbit="auto auto 165%"
          field-of-view="28deg"
          shadow-intensity="0.8"
          shadow-softness="0.75"
          exposure="1.08"
          environment-image="neutral"
          interaction-prompt="auto"
          touch-action="pan-y"
        />
      ) : poster ? (
        <img src={poster} alt={alt} className="h-full w-full object-contain" />
      ) : null}
      <div className="model-hint" aria-hidden="true">
        <span>3D Interactive</span>
        <span>Drag to rotate · Scroll to zoom</span>
      </div>
    </div>
  )
}
