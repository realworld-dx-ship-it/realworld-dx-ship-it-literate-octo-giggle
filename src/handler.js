const line = require("@line/bot-sdk");

async function handleEvent(event, config) {
  const client = new line.messagingApi.MessagingApiClient({
    channelAccessToken: config.channelAccessToken,
  });

  if (event.type !== "message" || event.message.type !== "text") {
    return null;
  }

  const reply = buildReply(event.message.text);

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [reply],
  });
}

function buildReply(text) {
  return {
    type: "text",
    text: `Received: ${text}`,
  };
}

module.exports = { handleEvent, buildReply };
