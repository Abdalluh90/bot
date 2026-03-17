const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TOKEN, { polling: true });
const ADMIN_ID = process.env.ADMIN_ID;

console.log("🔥 BOT STARTED");

// تخزين المستخدمين
let users = new Set();

// /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.first_name;

    if (!users.has(chatId)) {
        users.add(chatId);

        bot.sendMessage(ADMIN_ID, `👤 مستخدم جديد\nID: ${chatId}\n👥 Total: ${users.size}`);
    }

    bot.sendMessage(chatId,
`👋 أهلاً يا ${name}

📩 ابعت لينك الفيديو
وسيتم تحويلك للدعم لتحميله 👇

@Abdalluhgomaa`);
});

// استقبال اللينك
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || text.startsWith("/")) return;

    if (text.startsWith("http")) {

        // إرسال للإدمن
        bot.sendMessage(ADMIN_ID,
`📥 طلب تحميل جديد

👤 ID: ${chatId}
🔗 ${text}`);

        bot.sendMessage(chatId,
`✅ تم استلام طلبك

📩 سيتم التواصل معك قريبًا:
@Abdalluhgomaa`);
    }
});

// عدد المستخدمين
bot.onText(/\/users/, (msg) => {
    if (msg.chat.id == ADMIN_ID) {
        bot.sendMessage(msg.chat.id, `👥 Users: ${users.size}`);
    }
});
