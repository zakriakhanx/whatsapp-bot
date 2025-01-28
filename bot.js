const { makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const fs = require("fs");
const axios = require("axios");
const qrcode = require("qrcode-terminal");

async function connectWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const sock = makeWASocket({
        auth: state,
        browser: ["Chrome", "MacOS", "10.15.7"],  // Change OS version
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on("connection.update", ({ qr, connection }) => {
        if (qr) qrcode.generate(qr, { small: true });
        if (connection === "open") console.log("Bot is now online!");
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];  
        if (!msg.message) return;  // Ignore empty messages
    
        const sender = msg.key.remoteJid;
    
        // Extract message text safely
        const text = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text || 
                     msg.message.imageMessage?.caption || 
                     msg.message.videoMessage?.caption || 
                     "";
    
        // ✅ Ignore messages sent by the bot itself
        if (msg.key.fromMe) return;  
        if (!text) return;  // Ignore if text is still undefined
    
        console.log(`Message received from: ${sender} - ${text}`);
    
        if (text.toLowerCase().includes("hello")) {
            await sock.sendMessage(sender, { text: "Hello! How can I help you?" });
        } else if (text.startsWith("!yt ")) {
            const videoUrl = text.split(" ")[1];
            await sock.sendMessage(sender, { text: `Downloading video from: ${videoUrl}...` });
            // You can add a YouTube downloader here
        }
    });

    sock.ev.on("connection.update", ({ connection }) => {
        if (connection === "open") {
            console.log("✅ Bot connected successfully!");
        } else if (connection === "close") {
            console.log("⚠ Connection lost. Reconnecting...");
            connectWhatsApp();  // Reconnect
        }
    });
}

connectWhatsApp();