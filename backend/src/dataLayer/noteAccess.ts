import { NoteItem } from "../models/NoteItem"
import { createLogger } from "../utils/logger"
import * as AWSXRay from 'aws-xray-sdk'
import * as AWS from 'aws-sdk'

const XAWS = AWSXRay.captureAWS(AWS)


const logger = createLogger('deleteNote')

const notesTable = process.env.NOTES_TABLE
const userIdIndex = process.env.USER_ID_INDEX
const bucketName = process.env.ATTACHMENTS_S3_BUCKET

const docClient = createDynamoDBClient();

export async function getNoteById(noteId: string): Promise<NoteItem> {
  const result = await docClient
    .get({
      TableName: notesTable,
      Key: {
        noteId
      }
    })
    .promise()

  return result.Item
}

export async function getAllNotes(userId: string): Promise<NoteItem[]> {

  const result = await docClient.query({
    TableName: notesTable,
    IndexName: userIdIndex,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId
    }
  }).promise()

  const items = result.Items
  return items
}

export async function createNote(noteItem: NoteItem): Promise<NoteItem> {

  await docClient.put({
    TableName: notesTable,
    Item: noteItem
  }).promise()

  return noteItem
}

export async function deleteNote(noteId: string): Promise<any> {

  await docClient.delete({
    TableName: notesTable,
    Key: {
      noteId
    }
  }).promise()

  return { noteId }
}

export async function updateNote(noteId: string, userId: string, noteItem: NoteItem): Promise<any> {
  const prevNote = await getNoteById(noteId);
  logger.info("updating", { prevNote, userId })

  if (prevNote.userId !== userId) return;

  if (noteItem.attachmentName) {
    noteItem.attachmentUrl = `https://${bucketName}.s3.amazonaws.com/${noteId}/${noteItem.attachmentName}`
  }

  await docClient.put({
    TableName: notesTable,
    Item: {
      ...prevNote,
      ...noteItem,
      noteId,
    }
  }).promise()

  return { noteId }
}


export async function updateNoteAny(noteId: string, noteItem: any): Promise<any> {
  const prevNote = await getNoteById(noteId);

  await docClient.put({
    TableName: notesTable,
    Item: {
      ...prevNote,
      ...noteItem,
      noteId,
    }
  }).promise()

  return { noteId }
}

export function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}