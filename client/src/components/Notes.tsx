import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'

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


  isImage = (fName: string): boolean => {
    if (!fName) return false
    if (fName.endsWith('.jpg') || fName.endsWith('.jpeg') || fName.endsWith('.png')) {
      return true
    }

    return false
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newNoteName: event.target.value })
  }

  onEditButtonClick = (noteId: string) => {
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

  onNoteCheck = async (pos: number) => {
    try {
      const note = this.state.notes[pos]
      await patchNote(this.props.auth.getIdToken(), note.noteId, {
        name: note.name,
        createdAt: note.createdAt,
        done: !note.done
      })
      this.setState({
        notes: update(this.state.notes, {
          [pos]: { done: { $set: !note.done } }
        })
      })
    } catch {
      alert('Note check failed')
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
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
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
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
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
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onNoteCheck(pos)}
                  checked={note.done}
                />
              </Grid.Column>
              <Grid.Column width={9} verticalAlign="middle">
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
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(note.noteId)}
                >
                  <Icon name="pencil" />
                </Button>
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
              {note.attachmentName && (this.isImage(note.attachmentName) || console.log(this.isImage(note.attachmentName))) && (
                <Image src={note.attachmentUrl} size="small" wrapped />
              )}
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
