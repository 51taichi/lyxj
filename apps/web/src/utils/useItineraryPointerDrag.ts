import { onBeforeUnmount, ref, type Ref } from 'vue'
import type { ItineraryItem, ItineraryState } from './itinerary'
import { moveItineraryItem } from './itineraryDnD'

export interface DropTarget {
  dayIndex: number
  index: number
}

export interface DragSession {
  item: ItineraryItem
  fromDayIndex: number
  fromIndex: number
}

function hitTestDropTarget(x: number, y: number): DropTarget | null {
  const el = document.elementFromPoint(x, y)
  const slot = el?.closest('[data-day-slot]') as HTMLElement | null
  if (!slot) return null
  const dayIndex = Number(slot.dataset.dayIndex)
  const index = Number(slot.dataset.slotIndex ?? 0)
  if (Number.isNaN(dayIndex) || Number.isNaN(index)) return null
  return { dayIndex, index }
}

export function useItineraryPointerDrag(itinerary: Ref<ItineraryState>, enabled: () => boolean) {
  const dragSession = ref<DragSession | null>(null)
  const floatPos = ref({ x: 0, y: 0 })
  const dropTarget = ref<DropTarget | null>(null)

  function isSource(dayIndex: number, itemIndex: number): boolean {
    const s = dragSession.value
    if (!s) return false
    return s.fromDayIndex === dayIndex && s.fromIndex === itemIndex
  }

  function isPlaceholder(dayIndex: number, slotIndex: number): boolean {
    const t = dropTarget.value
    if (!t || !dragSession.value) return false
    return t.dayIndex === dayIndex && t.index === slotIndex
  }

  function cleanupListeners() {
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragSession.value) return
    floatPos.value = { x: e.clientX, y: e.clientY }
    dropTarget.value = hitTestDropTarget(e.clientX, e.clientY)
  }

  function onPointerUp(e: PointerEvent) {
    if (!dragSession.value) return
    const target = dropTarget.value ?? hitTestDropTarget(e.clientX, e.clientY)
    if (target) {
      moveItineraryItem(
        itinerary.value,
        {
          from: { type: 'day', dayIndex: dragSession.value.fromDayIndex },
          itemIndex: dragSession.value.fromIndex,
        },
        { type: 'day', dayIndex: target.dayIndex },
        target.index,
      )
    }
    dragSession.value = null
    dropTarget.value = null
    cleanupListeners()
  }

  function onChipPointerDown(dayIndex: number, itemIndex: number, e: PointerEvent) {
    if (!enabled()) return
    const item = itinerary.value.days[dayIndex]?.[itemIndex]
    if (!item) return
    e.preventDefault()
    dragSession.value = { item, fromDayIndex: dayIndex, fromIndex: itemIndex }
    floatPos.value = { x: e.clientX, y: e.clientY }
    dropTarget.value = null
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  onBeforeUnmount(cleanupListeners)

  return {
    dragSession,
    floatPos,
    dropTarget,
    isSource,
    isPlaceholder,
    onChipPointerDown,
  }
}
