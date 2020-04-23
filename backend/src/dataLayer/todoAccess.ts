import { TodoItem } from "../models/TodoItem"
import { createLogger } from "../utils/logger"
import * as AWSXRay from 'aws-xray-sdk'
import * as AWS from 'aws-sdk'

const XAWS = AWSXRay.captureAWS(AWS)


const logger = createLogger('deleteTodo')

const todosTable = process.env.TODOS_TABLE
const userIdIndex = process.env.USER_ID_INDEX
const bucketName = process.env.ATTACHMENTS_S3_BUCKET

const docClient = createDynamoDBClient();

export async function getTodoById(todoId: string): Promise<TodoItem> {
  const result = await docClient
    .get({
      TableName: todosTable,
      Key: {
        todoId
      }
    })
    .promise()

  return result.Item
}

export async function getAllTodos(userId: string): Promise<TodoItem[]> {

  const result = await docClient.query({
    TableName: todosTable,
    IndexName: userIdIndex,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId
    }
  }).promise()

  const items = result.Items
  return items
}

export async function createTodo(todoItem: TodoItem): Promise<TodoItem> {

  await docClient.put({
    TableName: todosTable,
    Item: todoItem
  }).promise()

  return todoItem
}

export async function deleteTodo(todoId: string): Promise<any> {

  await docClient.delete({
    TableName: todosTable,
    Key: {
      todoId
    }
  }).promise()

  return { todoId }
}

export async function updateTodo(todoId: string, userId: string, todoItem: TodoItem): Promise<any> {
  const prevTodo = await getTodoById(todoId);
  logger.info("updating", { prevTodo, userId })

  if (prevTodo.userId !== userId) return;

  if (todoItem.attachmentName) {
    todoItem.attachmentUrl = `https://${bucketName}.s3.amazonaws.com/${todoId}/${todoItem.attachmentName}`
  }

  await docClient.put({
    TableName: todosTable,
    Item: {
      ...prevTodo,
      ...todoItem,
      todoId: todoId,
    }
  }).promise()

  return { todoId }
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