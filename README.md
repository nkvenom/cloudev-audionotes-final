# SLS Audio Notes

Simple Serverless framework App based on the Note App that allows users to record audio or upload a file and see the transcribed text.

![Application running on port 3000](images/audionotes-sshot.png?raw=true)


# Functionality of the application

The application allows the user to create, edit and delete audio notes. When the user edits a Note can attach an audio file that will be automatically transcribed.

# Using the application
The serverless functions are already uploaded and running, so you must start `npm start` from the `client/` folder that is already configured to connect to the API.

# Note items

The application stores Note items, and each Note item contains the following fields:

* `noteId` (string) - a unique id for an item
* `userId` (string) - the id of the user that this note belongs to
* `createdAt` (string) - date and time when an item was created
* `name` (string) - The title of the Note
* `description` (string) - The transcription of the Note using AWS Transcribe
* `attachmentUrl` (string) (optional) - a URL pointing to audio file used to create the transcription
* `attachmentName` (string) (optional) - the audio file name, useful to determine if it is a valid type mp3, wav, mp4



# Implemented Functions

To implement this project, you need to implement the following functions and configure them in the `serverless.yml` file:

* `Authorizer3000` - this function implements a custom authorizer for API Gateway that is referenced in all other functions.

* `GetNotes` - return all Notes for a current user. A user id can be extracted from a JWT token that is sent by the frontend

It returns data that looks like this:

```json
{
  "items": [
    {
      "attachmentName": "demo1.mp3",
      "attachmentUrl": "https://cd-audio-notes-dev.s3.amazonaws.com/5c3bb2c0-c656-45d1-8691-bbc8343be21f/demo1.mp3",
      "createdAt": "2020-05-10T20:43:30.465Z",
      "description": "Union and by creating an area of freedom, security and justice.",
      "done": false,
      "name": "Some Lol",
      "noteId": "5c3bb2c0-c656-45d1-8691-bbc8343be21f",
      "userId": "google-oauth2|108045784119633570839"
    },
    {
      "attachmentName": "audio (1).mp3",
      "attachmentUrl": "https://cd-audio-notes-dev.s3.amazonaws.com/36290cbc-cb7e-4c41-9605-ac29e3fe57d9/audio (1).mp3",
      "createdAt": "2020-05-10T21:17:27.411Z",
      "done": false,
      "name": "Important Audionote",
      "noteId": "36290cbc-cb7e-4c41-9605-ac29e3fe57d9",
      "userId": "google-oauth2|108045784119633570839"
    }
  ]
}
```

* `CreateNote` - creates a new Note for the current user. A shape of data send by a client application to this function can be found in the `CreateNoteRequest.ts` file

It receives a new Note item to be created in JSON format that looks like this:

```json
{
  "name": "Important Audionote",
}
```

It returns a new Note item that looks like this:

```json
{
  "createdAt": "2020-05-10T21:17:27.411Z",
  "done": false,
  "name": "Important Audionote",
  "noteId": "36290cbc-cb7e-4c41-9605-ac29e3fe57d9",
  "userId": "google-oauth2|108045784119633570839"
}
```

* `UpdateNote` - update a Note item created by the current user. A shape of data send by a client application to this function can be found in the `UpdateNoteRequest.ts` file

It receives an object that contains three fields that can be updated in a Note item:

```json
{
  "name": "Important Audionote",
  "createdAt": "2019-07-29T20:01:45.424Z",
  "done": true
}
```

The id of an item that be updated is passed as a URL parameter.

It returns an empty body.

* `DeleteNote` - should delete a Note item created by a current user. Expects an id of a Note item to remove.

It returns an empty body.

* `GenerateUploadUrl` - returns a pre-signed URL that can be used to upload an attachment file for a Note item.

It should return a JSON object that looks like this:

```json
{
  "uploadUrl": "https://s3-bucket-name.s3.eu-west-2.amazonaws.com/image.png"
}
```

* `UpdateNote` - Allows the user to update fields of the JSON in dynamoDb.

* `TranscribeNote` - This function triggers when the user uploads the audio to S3. It creates a new transcription Job and starts it asynchronously. 

* `TranscriptionToNote` - When the transcription JSON appears in the transcription bucket it reads the text and updates the corresponding DynamoDB Item. 


The userId is extracted from a JWT token passed by a client.

All resources are created using the serverless.yml file


# Frontend

The `client` folder contains a web application that can use the API that was developed. The application is expected to run on localhost:3000 because the auth0 config is expecting the connection from that endpoint.

To start the app in the client folder run:
```bash
   npm run start
```

## Authentication

To implementation uses an Auth0 application with the RS256 algorithm


## Logging

The logging uses  [Winston](https://github.com/winstonjs/winston) logger that creates [JSON formatted](https://stackify.com/what-is-structured-logging-and-why-developers-need-it/) log statements.
