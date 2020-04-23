import * as uuid from 'uuid'

import * as access from '../dataLayer/todoAccess'
import { TodoItem } from '../models/TodoItem'
import { getUserIdFromAuthHeader } from '../lambda/utils'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { createLogger } from '../utils/logger'

const logger = createLogger('business')

export async function getAllTodos(authHeader: string): Promise<TodoItem[]> {
  const userId = getUserIdFromAuthHeader(authHeader)

  if (!userId) return []

  const todos = access.getAllTodos(userId)

  return todos
}

export async function createTodo(event: APIGatewayProxyEvent) {
  

  const newDate = new Date()
  const createdAt = newDate.toISOString()
  const userId = getUserIdFromAuthHeader(event.headers.Authorization)

  const newTodo: CreateTodoRequest = JSON.parse(event.body)

  return await access.createTodo({
    todoId: uuid.v4(),
    name: newTodo.name,
    dueDate: newTodo.dueDate,
    createdAt,
    userId,
    done: false
  })
}

export async function deleteTodo(todoId: string) {
  return await access.deleteTodo(todoId)
}


export async function updateTodo(event: APIGatewayProxyEvent) {
  const todoId = event.pathParameters.todoId
  const updatedTodo: TodoItem = JSON.parse(event.body)
  const userId = getUserIdFromAuthHeader(event.headers.Authorization)

  logger.info({ userId, updatedTodo })

  if (!userId) return 

  return await access.updateTodo(todoId, userId, updatedTodo) 
}