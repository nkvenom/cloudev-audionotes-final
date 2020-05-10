export interface NoteItem {
  userId: string
  noteId: string
  createdAt: string
  name: string
  done: boolean
  attachmentUrl?: string
  attachmentName?: string
  description?: string
}
