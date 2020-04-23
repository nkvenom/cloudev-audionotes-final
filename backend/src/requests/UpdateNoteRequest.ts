/**
 * Fields in a request to update a single NOTE item.
 */
export interface UpdateNoteRequest {
  name: string
  createdAt: string
  done: boolean
}