import type { DetailedHTMLProps, HTMLAttributes } from 'react'

interface ModelViewerAttributes
  extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
  src?: string
  poster?: string
  alt?: string
  'camera-controls'?: boolean
  'auto-rotate'?: boolean
  'auto-rotate-delay'?: string | number
  'rotation-per-second'?: string
  'tone-mapping'?: string
  'camera-orbit'?: string
  'min-camera-orbit'?: string
  'max-camera-orbit'?: string
  'field-of-view'?: string
  'shadow-intensity'?: string | number
  'shadow-softness'?: string | number
  exposure?: string | number
  'environment-image'?: string
  'interaction-prompt'?: string
  'touch-action'?: string
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes
    }
  }
}
