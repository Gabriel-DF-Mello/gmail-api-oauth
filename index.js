const fs = require("fs").promises;
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");

// If modifying these scopes, delete token.json.
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listLabels(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.labels.list({
    userId: "me",
  });
  const labels = res.data.labels;
  if (!labels || labels.length === 0) {
    console.log("No labels found.");
    return;
  }
  console.log("Labels:");
  labels.forEach((label) => {
    console.log(`- ${label.name}`);
  });
}

const makeBody = (params) => {
  params.subject = new Buffer.from(params.subject).toString("base64");
  const str = [
    // 'Content-Type: text/plain; charset="UTF-8"\n',
    // "MINE-Version: 1.0\n",
    // "Content-Transfer-Encoding: 7bit\n",
    `to: ${params.to} \n`,
    `from: ${params.from} \n`,
    `subject: =?UTF-8?B?${params.subject}?= \n\n`,
    params.message,
  ].join(""); // <--- Modified
  return new Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

async function sendEmail(auth) {
  const gmail = google.gmail({ version: "v1", auth });

  const messageBody = "this is a test message";

  const message = makeBody({
    to: "rodrigo.santos@digitalk.com.br",
    from: "rodrigo.santos@digitalk.com.br",
    subject: "test title",
    message: messageBody,
  });

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: message,
    },
  });

  console.log(res.data);
}

async function watchEmail(auth) {
  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName: "projects/projeto-rodrigo-420517/topics/MyTopic",
      labelIds: ["INBOX"],
    },
  });

  console.log(res.data);
}

// authorize().then(listLabels).catch(console.error);
// authorize().then(sendEmail).catch(console.error);
authorize().then(watchEmail).catch(console.error);
