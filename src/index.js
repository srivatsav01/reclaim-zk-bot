const TelegramBot = require( 'node-telegram-bot-api');
const ReclaimSDK = require('@reclaimprotocol/reclaim-client-sdk').default;
const { v4 : uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const Stream = require('stream');


// Create a stream from a string
const stringToStream = async (str) => {
    const readableStream = new Stream.Readable();
    readableStream.push(str);
    readableStream.push(null);
    return readableStream;
}

const token = 'API_KEY';


console.log(ReclaimSDK)
const bot = new TelegramBot(token, {polling: true,filepath: false});


async function createChatInviteLink( apiToken ) {
//   const date = new Date();
//   date.setFullYear(date.getFullYear() + 1);
  const data = {
    chat_id: -1001873089735,
    member_limit: 1,
    // expire_date: Math.floor(date.getTime() / 1000)
  };

  const url = `https://api.telegram.org/bot${apiToken}/createChatInviteLink`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error:", error);
  }
}
bot.onText(/\/start/, async (msg) => {
    const opts = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: 'Start', callback_data: 'start' }]
        ]
      })
    };
  
    bot.sendMessage(msg.chat.id, 'Press the start button to begin.', opts);
  });
  
  bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    console.log(msg)
    const chatId = msg.chat.id;
    const userId = uuidv4();
    const reclaimSDK = new ReclaimSDK('b4d0c5aa-4d8f-4845-a557-cdb293dc84f2');
    console.log(await createChatInviteLink(token))
  
    try {
      const session = await reclaimSDK.generateSession(userId);
      console.log('session', session);
  
      // Generate QR code
      const qrCodeImageUrl = await QRCode.toDataURL(session.link);
      console.log(qrCodeImageUrl)

      const buffer = Buffer.from(qrCodeImageUrl.split(",")[1], 'base64');
      const bufferStream = new Stream.PassThrough();
      bufferStream.end(buffer);

  
      // Send the QR code image to the user
      bot.sendPhoto(chatId,buffer,{}, { contentType: 'image/png' });
  
      bot.sendMessage(chatId, `Please submit a proof of your balance on bybit . Use the QR code or this link: ${session.link}`);
      console.log(chatId);
  try {

    const submissionData = await session?.onSubmission;
    console.log(submissionData)
    if (submissionData?.isProofSubmitted) {
        const resParameters = JSON.parse(submissionData.proofs[0].parameters)
        const resBalance = resParameters.balance
        console.log(resBalance)

        if(parseFloat(resBalance) > 100){
      const inviteLink = await createChatInviteLink(token);
      console.log(inviteLink)
      bot.sendMessage(chatId, `Access granted. Join the group: ${inviteLink.result.invite_link}`);
        }else {
            bot.sendMessage(chatId, `Access denied. Your balance is less than 100$`);
        }
    }
  }
  catch(e){
    console.log('error', e);
    bot.sendMessage(chatId, 'Invalid submission please try again.');

  }
      
    } catch (e) {
      console.log('error', e);
      bot.sendMessage(chatId, 'An error occurred during session generation.');
    }
  });