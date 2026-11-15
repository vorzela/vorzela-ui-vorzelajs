import { createContext, useContext } from '@vorzelajs/dom'
import type { ReactNode } from '../../types.ts'

export type Size = 'sm' | 'md' | 'lg'

const SizeContext = createContext<Size>('md', 'size')

export function SizeProvider({
  size,
  children,
}: {
  size: Size
  children: ReactNode
}) {
  return <SizeContext.Provider value={size}>{children}</SizeContext.Provider>
}

export function useSize(): Size {
  return useContext(SizeContext)
}
