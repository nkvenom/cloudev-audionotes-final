const apiId = 'ytyb4rs16i'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev`

export const authConfig = {
  domain: 'cd-c4-final.auth0.com',              // Auth0 domain
  clientId: 't33Rngt19Vpsmj4BKyFJ22RauaGz4Jb6', // Auth0 client id
  callbackUrl: `http://${window.location.host}/callback`
}
