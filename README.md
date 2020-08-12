# acm_bot
A Discord automated bot for the official ACM Community server.
### botconfig.js (required)
```
module.exports = {
	"token": "discord token",
	"prefix": "prefix",
	"activity":  {
		"type": "PLAYING | LISTENING | WATCHING | STREAMING",
		"description": "description"
	},
	"sentryDNS": "sentry dns link",
	"databaseURL": "mongodb db url",
	"responseFormat": 0,
	"disabledCommands": ["name of commands"],
	"disabledCategories": ["name of categories"],
	"channels": {
		"verification": "channel id",
		"error": "channel id"
	},
	"roles": {
		"member": "role id",
		"officer": "role id",
		"director": "role id"
	}
}
```
