import { S3Event, S3Handler } from 'aws-lambda'
import 'source-map-support/register'
import { createLogger } from '../../utils/logger'
import * as AWSXRay from 'aws-xray-sdk'
import * as AWS from 'aws-sdk'

const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3()
const logger = createLogger('transcriptionToNote')
const transcriptionBucket = process.env.TRANSCRIPTION_S3_BUCKET


export const handler: S3Handler = async (event: S3Event): Promise<void> => {
  const records = event.Records

  logger.info('processing', { records: records.length })
  const [rec] = records
  const [noteId, dateHash] = rec.s3.object.key.split('_')
  const recordUrl = `https://s3.amazonaws.com/${
    transcriptionBucket}/${
    rec.s3.object.key
    }`

  logger.info({ noteId, dateHash, recordUrl, rec, object: rec.s3.object })


  try {
    const params = {
      Bucket: transcriptionBucket,
      Key: rec.s3.object.key
    }

    logger.info("params", { params })
    const fContents = await s3.getObject(params).promise()
    logger.info("fContents", { daproto: Object.getPrototypeOf(fContents.Body).constructor.name, json: fContents.Body.toString('utf8') })
  } catch (error) {
    console.log(error);
    return;
  }
}