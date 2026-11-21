/// <reference types="vite/client" />

import type { DetailedHTMLProps, HTMLAttributes } from 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          src?: string
          poster?: string
          alt?: string
          'camera-controls'?: boolean | string
          'auto-rotate'?: boolean | string
          'auto-rotate-delay'?: number | string
          'rotation-per-second'?: string
          'shadow-intensity'?: number | string
          'shadow-softness'?: number | string
          exposure?: number | string
          'environment-image'?: string
          'interaction-prompt'?: string
          'touch-action'?: string
        },
        HTMLElement
      >
    }
  }
}
