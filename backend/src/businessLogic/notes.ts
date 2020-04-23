import * as uuid from 'uuid'

import * as access from '../dataLayer/noteAccess'
import { NoteItem } from '../models/NoteItem'
import { getUserIdFromAuthHeader } from '../lambda/utils'
import { CreateNoteRequest } from '../requests/CreateNoteRequest'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { createLogger } from '../utils/logger'

const logger = createLogger('business')

export async function getAllNotes(authHeader: string): Promise<NoteItem[]> {
  const userId = getUserIdFromAuthHeader(authHeader)

  if (!userId) return []

  return access.getAllNotes(userId)
}

export async function createNote(event: APIGatewayProxyEvent) {


  const newDate = new Date()
  const createdAt = newDate.toISOString()
  const userId = getUserIdFromAuthHeader(event.headers.Authorization)

  const newNote: CreateNoteRequest = JSON.parse(event.body)

  return await access.createNote({
    noteId: uuid.v4(),
    name: newNote.name,
    createdAt,
    userId,
    done: false
  })
}

export async function deleteNote(noteId: string) {
  return await access.deleteNote(noteId)
}


export async function updateNote(event: APIGatewayProxyEvent) {
  const { noteId } = event.pathParameters
  const updatedNote: NoteItem = JSON.parse(event.body)
  const userId = getUserIdFromAuthHeader(event.headers.Authorization)

  logger.info({ userId, updatedNote })

  if (!userId) return

  return await access.updateNote(noteId, userId, updatedNote)
}