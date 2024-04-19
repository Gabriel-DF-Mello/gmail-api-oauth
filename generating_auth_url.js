const fs = require("fs").promises;
const path = require("path");
const { google } = require("googleapis");
const http = require('http');
const url = require('url');
const open = require('open');
const destroyer = require('server-destroy');

const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
const TOKEN_PATH = path.join(process.cwd(), "token.json");

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
];

async function execute() {
  const credentials = await fs.readFile(CREDENTIALS_PATH);  
  const keys = JSON.parse(credentials);
  const key = keys.installed || keys.web;JSON.parse(credentials).installed;

  const REDIRECT_URL = "http://localhost:3000/oauth2callback";

  const oAuth2Client = new google.auth.OAuth2(
    key.client_id,
    key.client_secret,
    REDIRECT_URL
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  const server = http
      .createServer(async (req, res) => {
        try {
          if (req.url.indexOf('/oauth2callback') > -1) {
            // acquire the code from the querystring, and close the web server.
            const qs = new url.URL(req.url, 'http://localhost:3000')
              .searchParams;
            const code = qs.get('code');
            console.log(`Code is ${code}`);
            res.end('Authentication successful! Please return to the console.');
            server.destroy();

            // Now that we have the code, use that to acquire tokens.
            const r = await oAuth2Client.getToken(code);
            console.log(r.tokens)
            // Make sure to set the credentials on the OAuth2 client.
            oAuth2Client.setCredentials(r.tokens);

            console.info('Tokens acquired.');
            return oAuth2Client;
          }
        } catch (e) {
         console.log(e)
        }
      })
      .listen(3000, () => {
        // open the browser to the authorize url to start the workflow
        open(authUrl, {wait: false}).then(cp => cp.unref());
      });
      destroyer(server);
}

async function authJson(){
  const credentials = await fs.readFile(CREDENTIALS_PATH);  
  const keys = JSON.parse(credentials);
  const key = keys.installed || keys.web;JSON.parse(credentials).installed;

  const REDIRECT_URL = "http://localhost:3000/oauth2callback";

  const oAuth2Client = new google.auth.OAuth2(
    key.client_id,
    key.client_secret,
    REDIRECT_URL
  );

  const _tokens = await fs.readFile(TOKEN_PATH);  
  const tokens = JSON.parse(_tokens);

  oAuth2Client.setCredentials(tokens);

  return oAuth2Client
}

async function getEmail(auth){
  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.messages.get({
    userId: "me",
    id: '18eedcb773dc894c'
  })

  console.log(res.data)
}

authJson().then(getEmail).catch(console.error);
