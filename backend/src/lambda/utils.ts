import { APIGatewayProxyEvent } from "aws-lambda";
import { parseUserId } from "../auth/utils";

/**
 * Get a user id from an API Gateway event
 * @param event an event from API Gateway
 *
 * @returns a user id from a JWT token
 */
export function getUserId(event: APIGatewayProxyEvent): string {
  const authorization = event.headers.Authorization
  const [, jwtToken] = authorization.split(' ')

  return parseUserId(jwtToken)
}

export function getUserIdFromAuthHeader(authHeader: string): string {
  const [, jwtToken] = authHeader.split(' ')

  return parseUserId(jwtToken)
}

export function getUserIdFromToken(jwtToken: string): string {
  return parseUserId(jwtToken)
}
