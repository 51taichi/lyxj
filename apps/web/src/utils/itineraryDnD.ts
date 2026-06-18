import { ref, type Ref } from 'vue'
import type { ItineraryItem, ItineraryState } from './itinerary'

export type ItineraryLocation =
  | { type: 'pool' }
  | { type: 'day'; dayIndex: number }

export interface DragPayload {
  from: ItineraryLocation
  itemIndex: number
}

function removeAt(state: ItineraryState, loc: ItineraryLocation, itemIndex: number): ItineraryItem | null {
  const list = loc.type === 'pool' ? state.pool : state.days[loc.dayIndex]
  if (!list || itemIndex < 0 || itemIndex >= list.length) return null
  const [item] = list.splice(itemIndex, 1)
  return item ?? null
}

function insertAt(
  state: ItineraryState,
  loc: ItineraryLocation,
  item: ItineraryItem,
  atIndex?: number,
) {
  const list = loc.type === 'pool' ? state.pool : state.days[loc.dayIndex]
  if (!list) return
  const index = atIndex === undefined ? list.length : Math.max(0, Math.min(atIndex, list.length))
  list.splice(index, 0, item)
}

export function moveItineraryItem(
  state: ItineraryState,
  from: DragPayload,
  to: ItineraryLocation,
  toIndex?: number,
) {
  const item = removeAt(state, from.from, from.itemIndex)
  if (!item) return

  let targetIndex = toIndex
  if (
    from.from.type === to.type &&
    (to.type === 'pool' || (from.from.type === 'day' && from.from.dayIndex === to.dayIndex))
  ) {
    const list = to.type === 'pool' ? state.pool : state.days[to.dayIndex]
    if (targetIndex !== undefined && from.itemIndex < targetIndex) {
      targetIndex -= 1
    }
    if (targetIndex === undefined) targetIndex = list.length
  }

  insertAt(state, to, item, targetIndex)
}

export function useItineraryDnD(state: Ref<ItineraryState>) {
  const dragging = ref<DragPayload | null>(null)
  const dropHint = ref<{ loc: ItineraryLocation; index: number } | null>(null)

  function onDragStart(payload: DragPayload, e: DragEvent) {
    dragging.value = payload
    e.dataTransfer?.setData('application/json', JSON.stringify(payload))
    e.dataTransfer!.effectAllowed = 'move'
  }

  function onDragEnd() {
    dragging.value = null
    dropHint.value = null
  }

  function onDragOver(loc: ItineraryLocation, index: number, e: DragEvent) {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'move'
    dropHint.value = { loc, index }
  }

  function onDrop(loc: ItineraryLocation, index: number, e: DragEvent) {
    e.preventDefault()
    const raw = e.dataTransfer?.getData('application/json')
    if (!raw) return
    try {
      const from = JSON.parse(raw) as DragPayload
      moveItineraryItem(state.value, from, loc, index)
    } catch {
      /* ignore */
    }
    dragging.value = null
    dropHint.value = null
  }

  function onZoneDragOver(loc: ItineraryLocation, e: DragEvent) {
    const list = loc.type === 'pool' ? state.value.pool : state.value.days[loc.dayIndex]
    onDragOver(loc, list?.length ?? 0, e)
  }

  function onZoneDrop(loc: ItineraryLocation, e: DragEvent) {
    const list = loc.type === 'pool' ? state.value.pool : state.value.days[loc.dayIndex]
    onDrop(loc, list?.length ?? 0, e)
  }

  return {
    dragging,
    dropHint,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    onZoneDragOver,
    onZoneDrop,
  }
}
