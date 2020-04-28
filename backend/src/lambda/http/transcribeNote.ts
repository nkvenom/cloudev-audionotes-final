import { S3Event, S3Handler } from 'aws-lambda'
import 'source-map-support/register'
import { createLogger } from '../../utils/logger'
import * as AWSXRay from 'aws-xray-sdk'
import * as AWS from 'aws-sdk'

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('transcribeNote')
const transcribeService = new XAWS.TranscribeService()
const VALID_EXT_REGEXP = /(mp3|mp4|flac|wav)$/
const transcriptionBucket = process.env.TRANSCRIPTION_S3_BUCKET
const audioBucket = process.env.ATTACHMENTS_S3_BUCKET
export const handler: S3Handler = async (event: S3Event): Promise<void> => {
  const records = event.Records

  logger.error('processing', { records: records.length })
  for (const rec of records) {
    const [noteId, fName] = rec.s3.object.key.split('/')
    const recordUrl = `https://s3.amazonaws.com/${
      audioBucket}/${
      rec.s3.object.key
      }`

    if (!VALID_EXT_REGEXP.exec(fName)) {
      logger.error('bad-ext', { rec, recordUrl })
      continue;
    }

    const [mediaFormat] = VALID_EXT_REGEXP.exec(fName)
    logger.info({ rec, recordUrl })

    const dateSuffix = new Date().toISOString().replace(/:/g, '');
    logger.info({ dateSuffix })

    const transcribeParams = {
      LanguageCode: process.env.LANGUAGE_CODE,
      Media: { MediaFileUri: recordUrl },
      MediaFormat: mediaFormat,
      TranscriptionJobName: `${noteId}-${dateSuffix}`,
      OutputBucketName: transcriptionBucket,
    }

    logger.info({transcribeParams})
    const result = await transcribeService.startTranscriptionJob(transcribeParams).promise();

    logger.info({ result })
  }
}