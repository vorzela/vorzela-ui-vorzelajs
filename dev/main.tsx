import { installBrowserDevtools } from '@vorzelajs/devtools/browser'
import { render } from '@vorzelajs/dom'
import { App } from './app.tsx'
import '~/styles/global.scss'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root element #root was not found.')
}

if (import.meta.env.DEV) {
  installBrowserDevtools()
}

render(<App />, container)
