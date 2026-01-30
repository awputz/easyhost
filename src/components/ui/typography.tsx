import { cn } from '@/lib/utils'

interface TypographyProps {
  children: React.ReactNode
  className?: string
}

export function Display({ children, className }: TypographyProps) {
  return (
    <h1 className={cn('font-serif text-display-1 text-navy-900', className)}>
      {children}
    </h1>
  )
}

export function Heading1({ children, className }: TypographyProps) {
  return (
    <h1 className={cn('font-serif text-heading-1 text-navy-900', className)}>
      {children}
    </h1>
  )
}

export function Heading2({ children, className }: TypographyProps) {
  return (
    <h2 className={cn('font-serif text-heading-2 text-navy-900', className)}>
      {children}
    </h2>
  )
}

export function Heading3({ children, className }: TypographyProps) {
  return (
    <h3 className={cn('font-serif text-heading-3 text-navy-900', className)}>
      {children}
    </h3>
  )
}

export function Body({ children, className }: TypographyProps) {
  return (
    <p className={cn('font-sans text-body text-navy-700', className)}>
      {children}
    </p>
  )
}

export function BodyLarge({ children, className }: TypographyProps) {
  return (
    <p className={cn('font-sans text-body-lg text-navy-600', className)}>
      {children}
    </p>
  )
}

export function Caption({ children, className }: TypographyProps) {
  return (
    <p className={cn('font-sans text-caption text-navy-500', className)}>
      {children}
    </p>
  )
}

export function Label({ children, className }: TypographyProps) {
  return (
    <span className={cn('text-label text-navy-500', className)}>
      {children}
    </span>
  )
}

export function Mono({ children, className }: TypographyProps) {
  return (
    <span className={cn('font-mono text-sm text-navy-600', className)}>
      {children}
    </span>
  )
}
