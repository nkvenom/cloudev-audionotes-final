import * as React from 'react'
import { Button, Form, Icon } from 'semantic-ui-react'
import { getUploadUrl, patchNote, uploadFile } from '../api/notes-api'
import Auth from '../auth/Auth'
import MicRecorder from 'mic-recorder-to-mp3'


enum UploadState {
  NoUpload,
  FetchingPresignedUrl,
  UploadingFile,
}

interface EditNoteProps {
  match: {
    params: {
      noteId: string
    }
  }
  auth: Auth
}

interface EditNoteState {
  file: any
  uploadState: UploadState
  isAllowedAudio: boolean
  isRecording: boolean
  blobURL: string
  recordedFile: any
}

export class EditNote extends React.PureComponent<
  EditNoteProps,
  EditNoteState
  > {
  micRecorder = new MicRecorder({ bitRate: 128 })
  state: EditNoteState = {
    file: undefined,
    uploadState: UploadState.NoUpload,
    isAllowedAudio: false,
    isRecording: false,
    blobURL: '',
    recordedFile: null,
  }

  async componentDidMount() {
    this.getMedia({ audio: true })
  }

  async getMedia(constraints: any) {
    console.log("Getting permissions to use Mic")

    try {
      await navigator.mediaDevices.getUserMedia(constraints);
      this.setState({ isAllowedAudio: true })
    } catch (err) {
      alert('Can\'t get audio permission')
    }
  }

  handleStartRecording = async () => {
    console.log('Recording')

    if (this.state.isRecording) {
      return;
    }

    try {
      await this.micRecorder.start()
      this.setState({ isRecording: true });
    }
    catch (e) {
      console.error(e)
    }
  }

  handleStopRecording = async () => {
    console.log('Stopped recording')

    if (!this.state.isAllowedAudio) {
      alert('Can\'t get permissions to Record Audio');
      return;
    }

    if (!this.state.isRecording) {
      return;
    }

    const [audioBuffer, blob]: any = await this.micRecorder
      .stop()
      .getMp3()

    const blobURL = URL.createObjectURL(blob)
    const recordedFile = new File(audioBuffer, 'audio.mp3', { type: blob.type, lastModified: Date.now() })

    this.setState({ blobURL, recordedFile, isRecording: false })
  }

  handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = event;

    const files = target.files
    if (!files) return

    this.setState({
      file: files[0],
    })
  }

  handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    try {
      const { file } = this.state

      if (!file && !this.state.blobURL) {
        alert('File should be selected or clip must be recorded')
        return
      }

      this.setUploadState(UploadState.FetchingPresignedUrl)
      const attachmentName = file && file.name ? file.name : 'audio.mp3'
      const uploadUrl = await getUploadUrl(this.props.auth.getIdToken(), this.props.match.params.noteId, attachmentName)

      this.setUploadState(UploadState.UploadingFile)

      console.log(file, this.state.recordedFile)
      await uploadFile(uploadUrl, file || this.state.recordedFile)
      await patchNote(this.props.auth.getIdToken(), this.props.match.params.noteId, {
        attachmentName
      })

      alert('File was uploaded!')
    } catch (e) {
      alert('Could not upload a file: ' + e.message)
    } finally {
      this.setUploadState(UploadState.NoUpload)
    }
  }

  setUploadState(uploadState: UploadState) {
    this.setState({
      uploadState
    })
  }

  render() {
    return (
      <div>
        <h1>Record a New Note</h1>
        <div>
          <Button
            type="button"
            circular
            icon
            color={!this.state.isRecording ? "linkedin" : undefined}
            onClick={this.handleStartRecording}
          >
            <Icon name="circle" /> Record
          </Button>

          <Button
            type="button"
            circular
            icon
            color={this.state.isRecording ? "google plus" : undefined}
            onClick={this.handleStopRecording}
          >
            <Icon name='stop' />Stop
          </Button>

          <div>
            {this.state.blobURL && !this.state.isRecording &&
              <audio src={this.state.blobURL} controls={true} />}
          </div>
        </div>


        <h2>Or Upload an Audio File</h2>
        <Form onSubmit={this.handleSubmit}>
          <Form.Field>
            <label>Upload a File</label>
            <input
              type="file"
              accept=".mp3,.ogg, audio/*"
              placeholder="Image to upload"
              onChange={this.handleFileChange}
            />
          </Form.Field>

          {this.renderButton()}
        </Form>

      </div>
    )
  }

  renderButton() {

    return (
      <div>
        {this.state.uploadState === UploadState.FetchingPresignedUrl && <p>Uploading image metadata</p>}
        {this.state.uploadState === UploadState.UploadingFile && <p>Uploading file</p>}
        <Button
          loading={this.state.uploadState !== UploadState.NoUpload}
          type="submit"
        >
          Save
        </Button>
      </div>
    )
  }
}
