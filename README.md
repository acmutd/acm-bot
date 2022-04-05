# ACM Bot
🤖 | A Discord bot for the official ACM UTD Community server.

## Getting started with TypeScript
- [TypeScript Main Page](https://www.typescriptlang.org/)

## Getting started with DiscordJS
- [DiscordJS](https://discord.js.org/#/)
- [Discord.js v13 Changes](https://discordjs.guide/additional-info/changes-in-v13.html)
- [Interactions API Docs](https://discord.com/developers/docs/interactions/receiving-and-responding)

## Quick Start
#### Verify that your `node` version is at least `16.6.0`. 
```bash
node --version
```

#### Install MongoDB  
[Installation Tutorials](https://www.mongodb.com/docs/manual/installation/#mongodb-installation-tutorials)

#### Set up files
```bash
# Clone the repository
git clone https://github.com/acmutd/acm-bot.git

# Install required npm modules
npm i
```

> You'll also need a bot configuration (`botconfig.js`) and GCP auth file for Firestore (`acm-core.json`) to run the 
bot. Please contact a bot maintainer for these files. Place the files at the repository root.  

#### Run the bot
```bash
# Compile and then start the bot
npm run start
```

## Hosting details
#### Port Forwarding
Please ensure that the express port specified in the config is properly forwarded and allowed through any firewalls.
This is important for the points system, which relies on webhook requests from TypeForm.  

#### Auto Restart
Run with [PM2](https://pm2.keymetrics.io) for auto restart functionality.  

#### Remote MongoDB Management
If you are running the bot on a remote machine, you can access the MongoDB database from your local computer without having to expose MongoDB ports!  
To forward remote MongoDB running on port 27017 to local port 27018:
1. Create SSH tunnel  
   ```ssh -fN  -L 27018:localhost:27017 <your-username>@<remote-ip>```
3. Connect to MongoDB using [MongoDB Compass](https://www.mongodb.com/products/compass)  
   ```mongodb://localhost:27018/?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false```

#### GCP
The bot is currently hosted on GCP, with Compute Engine. Contact bot maintainers for access.  

## Contact
The current maintainers are [Eric Zhang](https://github.com/ez314) and [Nicolas Burnett](https://github.com/NickBurnett). 
