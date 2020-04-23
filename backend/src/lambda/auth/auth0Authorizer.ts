
import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { JwtToken } from '../../auth/JwtToken'
import { createLogger } from '../../utils/logger'

const logger = createLogger('auth')

const cert = `-----BEGIN CERTIFICATE-----
MIIDBTCCAe2gAwIBAgIJIyYga1LtpQNaMA0GCSqGSIb3DQEBCwUAMCAxHjAcBgNV
BAMTFWNkLWM0LWZpbmFsLmF1dGgwLmNvbTAeFw0yMDA0MTEyMDMyNTBaFw0zMzEy
MTkyMDMyNTBaMCAxHjAcBgNVBAMTFWNkLWM0LWZpbmFsLmF1dGgwLmNvbTCCASIw
DQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAJTakhM8qivLEXj1dH67QdVRUpDR
eJCOMdZOGXmLkmZwJYWxhBAvOa2G8p7dJZx+DRTKyddwtMAEs3Q0SFANQBvvZ4i5
pNHTZKZI7r7aWgF6S3xGJJSmw7gQgb4Kx2T4ePpTPaST7cmaNY5tDpnV1+kypfm3
G+/tuHk+dp/RqksDeQmiy02aBgzWeFxqeuSVoclDVGQTklJpMEUus8nVtuvwyK9x
evQQkW3iLKCxflPb4FKNKyvuJcOsJHVCQp5i/1SRju2keMvmZDS8QlqBINc18vVz
m6ENT2/VtZykoiUOzQ6hw4RCFz/bs+q5+Lt2nxQeyUMpOsd1zBkKoHHoW18CAwEA
AaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQU0ZYxlH9N4o20lQirTKUD
qxlry78wDgYDVR0PAQH/BAQDAgKEMA0GCSqGSIb3DQEBCwUAA4IBAQAPPsQ75X1W
t6XYKdiVQ3IS0ESBFeDPaY53Zhi+6ilIZZw4fxmDBdBxC84LJ8vzXav4+XY8SE+t
J9R9gz+rErxkOV8Nbc0+FDMTPhXZAn3gQf7+q382eZKeBSSjG72XqpYfw/9qB6O9
r4RoKJsyXdqFdhm/Cy7U7fpfICmyznWBbMF4mpSLVJYEZMDWaIPMrrQLvKf2WAd9
c1fNOTC2hMqz3h3BpDVUd2uF93oh3JKvi0zgzMjGb5xO76Z11RDnfDr0LaeEkeh9
qLsmvt7Y/Bwhbene68/gkUT4OirZG0YN8QXtAeer0+yGMkZzK6BDC5cxvZxExmcA
sxG3qiU9DC0G
-----END CERTIFICATE-----`;


export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  try {
    logger.info('Authorizing user', { event })
    const jwtToken = verifyToken(event.authorizationToken)
    logger.info('>>>', { jwtToken })

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.info('Auth Exception', {message: e.message})

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

function verifyToken(authHeader: string): JwtToken {
  if (!authHeader)
    throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const [, token] = authHeader.split(' ')

  return verify(token, cert, { algorithms: ['RS256'] }) as JwtToken
}
