import { actionsPreviews } from './actions.tsx'
import { chartPreviews } from './charts.tsx'
import { dataPreviews } from './data.tsx'
import { feedbackPreviews } from './feedback.tsx'
import { formsPreviews } from './forms.tsx'
import { layoutPreviews } from './layout.tsx'
import { mediaPreviews } from './media.tsx'
import { navigationPreviews } from './navigation.tsx'
import { overlayPreviews } from './overlays.tsx'
import { surfacesPreviews } from './surfaces.tsx'

/**
 * Every live preview, keyed by component slug. The registry reads from this map
 * so a component without a preview still gets a detail page (with a notice)
 * instead of breaking the route.
 */
export const previewBySlug: Record<string, () => unknown> = {
  ...actionsPreviews,
  ...formsPreviews,
  ...feedbackPreviews,
  ...dataPreviews,
  ...surfacesPreviews,
  ...navigationPreviews,
  ...layoutPreviews,
  ...overlayPreviews,
  ...mediaPreviews,
  ...chartPreviews,
}
