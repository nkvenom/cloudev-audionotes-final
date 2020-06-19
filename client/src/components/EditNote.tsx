import MicRecorder from 'mic-recorder-to-mp3'
import * as React from 'react'
import { Button, DropdownProps, Form, Icon, Select } from 'semantic-ui-react'
import { getUploadUrl, patchNote, uploadFile } from '../api/notes-api'
import Auth from '../auth/Auth'
import { Note } from '../types/Note'

const languageOptions = [
  { text: 'English-US', value: 'en-US' },
  { text: 'Spanish-US', value: 'es-US' },
  { text: 'Spanish-Spain', value: 'es-ES' },
  { text: 'English-GB', value: 'en-GB' },
  { text: 'English-IN', value: 'en-IN' },
  { text: 'English-IE', value: 'en-IE' },
  { text: 'English-AB', value: 'en-AB' },
  { text: 'English-WL', value: 'en-WL' },
  { text: 'English-AU', value: 'en-AU' },
]

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
  location: any
}

interface EditNoteState {
  file: any
  uploadState: UploadState
  isAllowedAudio: boolean
  isRecording: boolean
  blobURL: string
  recordedFile: any
  note?: Note
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
    note: undefined,
  }

  async componentDidMount() {
    this.setState({
      note: this.props.location.state.note
    })
  }

  async getMedia(constraints: any) {
    console.log("Getting permissions to use Mic")

    try {
      await navigator.mediaDevices.getUserMedia(constraints)
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
      this.setState({ isRecording: true })
    }
    catch (e) {
      console.error(e)
    }
  }

  handleStopRecording = async () => {
    console.log('Stopped recording')

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

  handleDownloadSrt = async () => {
    console.log('Generating SRT');

    const { note: { attachmentName, subsRaw = [] } = {} } = this.state

    let srtPayload = '';
    for (const [i, phrase] of subsRaw.entries()) {
      srtPayload += `${i + 1}\n`
      srtPayload += `${phrase.startTime} --> ${phrase.endTime}\n`
      srtPayload += `${phrase.text}\n`
      srtPayload += `\n`
    }

    this.download(`${attachmentName || 'subtitles'}.srt`, srtPayload)
  }

  download(filename: string, text: string) {
    const link = document.createElement('a');
    link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    link.setAttribute('download', filename);

    if (document.createEvent) {
        const event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        link.dispatchEvent(event);
    }
    else {
        link.click();
    }
}  

  handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = event;

    const files = target.files
    if (!files) return

    this.setState({
      file: files[0],
    })
  }

  onLangSelect = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => {
    const language: string = data.value as string
    console.log("onLangSelect -> language", language)
    const { note } = this.state
    if (!note) return;
    this.setState({
      note: {
        ...note,
        language
      }
    })
  }

  handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()

    try {
      const { file, note: { language = 'en-US' } = {} } = this.state

      if (!file && !this.state.blobURL) {
        alert('File should be selected or clip must be recorded')
        return
      }

      this.setUploadState(UploadState.FetchingPresignedUrl)
      const attachmentName = file && file.name ? file.name : 'audio.mp3'
      const uploadUrl = await getUploadUrl(this.props.auth.getIdToken(), this.props.match.params.noteId, attachmentName, language)

      this.setUploadState(UploadState.UploadingFile)

      console.log(file, this.state.recordedFile)
      await uploadFile(uploadUrl, file || this.state.recordedFile)
      await patchNote(this.props.auth.getIdToken(), this.props.match.params.noteId, {
        attachmentName,
        language
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
    const { note } = this.state
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
              <audio src={this.state.blobURL} controls />}
          </div>
        </div>

        <h2>Transcript</h2>
        <Button
          type="button"
          circular
          icon
          color={"linkedin"}
          onClick={this.handleDownloadSrt}
        >
          SRT
          </Button>
        <p>
          {note && note.transcription}
        </p>

        <h2>Or Upload an Audio File</h2>
        <Form onSubmit={this.handleSubmit}>
          <Form.Field>
            <label>Select Language {note && note.language}</label>
            <Select
              options={languageOptions}
              value={note ? note.language : 'en-US'}
              onChange={this.onLangSelect}
              selectOnBlur
              placeholder="Language"
            />
          </Form.Field>

          <Form.Field>
            <label>Upload a File</label>
            <input
              type="file"
              accept=".mp3,.ogg,.mp4,.ogg"
              placeholder="Audio File to upload"
              onChange={this.handleFileChange}
            />
          </Form.Field>

          <SaveButton uploadState={this.state.uploadState} />
        </Form>

      </div>
    )
  }
}

interface SaveButtonProps {
  uploadState: UploadState
}

const SaveButton: React.SFC<SaveButtonProps> = (props) => {
  return (
    <div>
      {props.uploadState === UploadState.FetchingPresignedUrl && <p>Uploading file metadata</p>}
      {props.uploadState === UploadState.UploadingFile && <p>Uploading file</p>}
      <Button
        loading={props.uploadState !== UploadState.NoUpload}
        type="submit"
      >
        Save
      </Button>
    </div>
  )
}
