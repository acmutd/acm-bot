# ACM Bot
🤖 | A Discord bot for the official ACM UTD Community server.

## Quick Start
Verify that your `node` version is at least `16.6.0`. 
```bash
node --version
```

Set up files
```bash
# Clone the repository
git clone https://github.com/acmutd/acm-bot.git

# Install required npm modules
npm i
```

You'll also need a bot configuration (`botconfig.js`) and GCP auth file for Firestore (`acm-core.json`) to run the 
bot. Please contact a bot maintainer for these files. Place the files at the repository root.  

Run the bot
```bash
# Compile and then start the bot
npm run start
```

## Hosting details
Please ensure that the express port specified in the config is properly forwarded and allowed through any firewalls.
This is important for the points system, which relies on webhook requests from TypeForm.  

Run with [PM2](https://pm2.keymetrics.io) for auto-restart functionality.  

The bot is currently hosted on GCP, with Compute Engine. Contact bot maintainers for access.  

## Contact
The current maintainers are [Eric Zhang](https://github.com/ez314) and [Nicolas Burnett](https://github.com/NickBurnett). 
