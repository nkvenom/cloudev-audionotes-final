import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { Button, Checkbox, Divider, Grid, Header, Icon, Input, Loader } from 'semantic-ui-react'
import { createNote as createNote, deleteNote, getNotes, patchNote } from '../api/notes-api'
import Auth from '../auth/Auth'
import { Note } from '../types/Note'


interface NotesProps {
  auth: Auth
  history: History
}

interface NotesState {
  notes: Note[]
  newNoteName: string
  loading: boolean
}

export class Notes extends React.PureComponent<NotesProps, NotesState> {
  state: NotesState = {
    notes: [],
    newNoteName: '',
    loading: true
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newNoteName: event.target.value })
  }

  onEditButtonClick = (noteId: string, note: Note) => {
    this.props.history.push(`/notes/${noteId}/edit`)
  }

  onNoteCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      if (!this.state.newNoteName || !this.state.newNoteName.trim()) {
        alert('Enter some Text in the input box')

        return;
      }
      const newNote = await createNote(this.props.auth.getIdToken(), {
        name: this.state.newNoteName,
        language: 'en-US'
      })
      this.setState({
        notes: [...this.state.notes, newNote],
        newNoteName: ''
      })
    } catch {
      alert('Note creation failed')
    }
  }

  onNoteDelete = async (noteId: string) => {
    try {
      await deleteNote(this.props.auth.getIdToken(), noteId)
      this.setState({
        notes: this.state.notes.filter(note => note.noteId != noteId)
      })
    } catch {
      alert('Note deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const notes = await getNotes(this.props.auth.getIdToken())
      this.setState({
        notes,
        loading: false
      })
    } catch (e) {
      alert(`Failed to fetch notes: ${e.message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">Audionotes</Header>

        {this.renderCreateNoteInput()}

        {this.renderNotes()}
      </div>
    )
  }

  renderCreateNoteInput() {
    return (
      <>
        <Grid.Row>
          <Grid.Column width={9}>
            <Input
              action={{
                color: 'linkedin',
                labelPosition: 'left',
                icon: 'add',
                content: 'New Note',
                onClick: this.onNoteCreate
              }}
              fluid
              actionPosition="left"
              placeholder="Someting somethin"
              value={this.state.newNoteName}
              onChange={this.handleNameChange}
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width={16}>
            <Divider />
          </Grid.Column>
        </Grid.Row>
      </>
    )
  }

  renderNotes() {
    if (this.state.loading) {
      return this.renderLoading()
    }

    return this.renderNotesList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading Notes
        </Loader>
      </Grid.Row>
    )
  }

  renderNotesList() {
    return (
      <Grid padded>
        {this.state.notes.map((note, pos) => {
          return (
            <Grid.Row key={note.noteId}>
              <Grid.Column width={10} verticalAlign="middle">
                {note.name}
              </Grid.Column>
              <Grid.Column width={3} floated="right">
                {note.createdAt}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                {note.attachmentName &&
                  <a href={note.attachmentUrl} download={note.attachmentName}>
                    <Icon name="attach" />
                  </a>
                }
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Link
                  to={{
                    pathname: `/notes/${note.noteId}/edit`,
                    state: {
                      note
                    }
                  }}
                >
                  <Icon name="pencil" />
                  Edit2
                </Link>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onNoteDelete(note.noteId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {note.transcription && <div><h3>Transcription</h3><p>{note.transcription && note.transcription.slice(0, 100)}</p></div>}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  calculatecreatedAt(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
