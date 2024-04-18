const fs = require("fs").promises;
const path = require("path");
const { google } = require("googleapis");

const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
];

async function execute() {
  const credentials = await fs.readFile(CREDENTIALS_PATH);

  const { client_id: CLIENT_ID, client_secret: CLIENT_SECRET } =
    JSON.parse(credentials).installed;

  const REDIRECT_URL = "http://localhost";

  const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URL
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("authUrl", authUrl);
}

execute().catch(console.error);
