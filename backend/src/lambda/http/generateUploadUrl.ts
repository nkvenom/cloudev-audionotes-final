import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { createLogger } from '../../utils/logger'

const XAWS = AWSXRay.captureAWS(AWS)
const bucketName = process.env.ATTACHMENTS_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION
const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

const logger = createLogger('generateUploadUrl')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { noteId } = event.pathParameters
  const { attachmentName, language } = JSON.parse(event.body)

  const uploadUrl = s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: `${noteId}/${language}/${attachmentName}`,
    Expires: parseInt(urlExpiration) || 120 // expires units in seconds
  })
  logger.info('datas', { noteId, attachmentName, language })

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ uploadUrl, noteId })
  }
}
