
import { cx } from '../../lib/cx.ts'
import styles from './aspect-ratio.module.scss'
import { forwardRef } from '../../types.ts'
import type { HTMLAttributes } from '../../types.ts'

export interface AspectRatioProps
  extends HTMLAttributes<HTMLDivElement> {
  ratio?: number
}

const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ className, ratio = 16 / 9, style, children, ...props }, ref) => (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: `${(1 / ratio) * 100}%`,
        ...style,
      }}
      className={cx(styles.root, className)}
      {...props}
    >
      <div className={styles.content}>{children}</div>
    </div>
  ),
)
AspectRatio.displayName = 'AspectRatio'

export { AspectRatio }
