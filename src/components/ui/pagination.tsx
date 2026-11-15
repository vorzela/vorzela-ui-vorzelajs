import { ChevronLeft, ChevronRight, MoreHorizontal } from './icons'

import { VisuallyHidden } from '../primitives/visually-hidden'
import { cx } from '../../lib/cx.ts'
import { Button, type ButtonSize, type ButtonVariant } from './button'
import styles from './pagination.module.scss'
import { forwardRef } from '../../types.ts'
import type { ComponentProps } from '../../types.ts'

export interface PaginationProps extends ComponentProps<'nav'> {
  className?: string
}

export function Pagination({ className, ...props }: PaginationProps) {
  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cx(styles.root, className)}
      {...props}
    />
  )
}

Pagination.displayName = 'Pagination'

export const PaginationContent = forwardRef<
  HTMLUListElement,
  ComponentProps<'ul'>
>(function PaginationContent({ className, ...props }, ref) {
  return (
    <ul ref={ref} className={cx(styles.content, className)} {...props} />
  )
})

PaginationContent.displayName = 'PaginationContent'

export const PaginationItem = forwardRef<
  HTMLLIElement,
  ComponentProps<'li'>
>(function PaginationItem({ className, ...props }, ref) {
  return <li ref={ref} className={cx(styles.item, className)} {...props} />
})

PaginationItem.displayName = 'PaginationItem'

export type PaginationLinkSize = ButtonSize | 'default'

export interface PaginationLinkProps
  extends ComponentProps<'button'> {
  isActive?: boolean
  variant?: ButtonVariant
  size?: PaginationLinkSize
}

export const PaginationLink = forwardRef<
  HTMLButtonElement,
  PaginationLinkProps
>(function PaginationLink(
  { className, isActive, variant, size = 'icon', ...props },
  ref,
) {
  return (
    <Button
      ref={ref}
      type="button"
      variant={variant ?? (isActive ? 'outline' : 'ghost')}
      size={size === 'default' ? 'md' : size}
      aria-current={isActive ? 'page' : undefined}
      className={cx(styles.link, className)}
      {...props}
    />
  )
})

PaginationLink.displayName = 'PaginationLink'

export const PaginationPrevious = forwardRef<
  HTMLButtonElement,
  PaginationLinkProps
>(function PaginationPrevious({ className, ...props }, ref) {
  return (
    <PaginationLink
      ref={ref}
      aria-label="Go to previous page"
      size="md"
      className={cx(styles.previous, className)}
      {...props}
    >
      <ChevronLeft aria-hidden />
      <span>Previous</span>
    </PaginationLink>
  )
})

PaginationPrevious.displayName = 'PaginationPrevious'

export const PaginationNext = forwardRef<
  HTMLButtonElement,
  PaginationLinkProps
>(function PaginationNext({ className, ...props }, ref) {
  return (
    <PaginationLink
      ref={ref}
      aria-label="Go to next page"
      size="md"
      className={cx(styles.next, className)}
      {...props}
    >
      <span>Next</span>
      <ChevronRight aria-hidden />
    </PaginationLink>
  )
})

PaginationNext.displayName = 'PaginationNext'

export interface PaginationEllipsisProps
  extends ComponentProps<'span'> {
  label?: string
}

export function PaginationEllipsis({
  className,
  label = 'More pages',
  ...props
}: PaginationEllipsisProps) {
  return (
    <span className={cx(styles.ellipsis, className)} {...props}>
      <MoreHorizontal aria-hidden />
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  )
}

PaginationEllipsis.displayName = 'PaginationEllipsis'
