import { S3Event, S3Handler } from 'aws-lambda'
import 'source-map-support/register'
import { createLogger } from '../../utils/logger'
import * as AWSXRay from 'aws-xray-sdk'
import * as AWS from 'aws-sdk'
import { updateNoteAny } from '../../dataLayer/noteAccess'

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

    const fContents = await s3.getObject(params).promise()

    const transcriptJson = JSON.parse(fContents.Body.toString('utf8'))
    const description = transcriptJson.results.transcripts.map(t => t.transcript).join('\n')

    logger.info("updating", { noteId })
    await updateNoteAny(noteId, { description, transcriptJson })

  } catch (error) {
    console.log(error);
    return;
  }
}