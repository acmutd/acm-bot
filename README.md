
# ACM Discord Bot

Using the DiscordJS JavaScript library, ACMUTD has created a feature-packed Discord bot in TypeScript to provide its members with necessary and convenient tools, services, and features to improve the Discord experience.

  

## Under-the-hood Functionality

Each core feature is split into two main handlers: services and managers. Every feature will use some sort of combination to ensure that all written code is capable of working cohesively, avoiding unnecessary calls and resulting in less overhead overall.

#### Services vs Managers

Without a doubt the most important concept to grasp when understanding the codebase is the difference between a service and manager. While there is a slight blend between their domains, there is a subtle difference between the two that provide distinct functionalities.

Managers, at their core, store some sort of state or data during the bot's runtime phase. Data such as who is connected to a voicechannel and for how long, reminder lists, and more are all handled by their respective managers. In addition, there may be some small core functions to aid in processing and managing said data.

Services provide an interface to interact with and compute different types of data. Most services have functions that interact with managers so that feature-implementation is more centralized, resulting in little to no overhead when calling the API.

## Main Features

#### Commands

The bot features 13 fully-functional commands that automate many of the boilerplate processes or tasks a user may need to perform, as well as provide intuitive interfaces for many of ACM's community-driven initiatives. Below are some of the most-used commands and their functionalities.

-- **circle** Feature-suite of ACM Community's Circles initiiative. Add, Manage, or Repost existing circles to maintain up-to-date information.

-- **vcevent** Feature-suite for recording voice-channel statistics such as active users and activity-time-per-user. Integrates well with ACM Education's points system.

-- **shoutout** Gives someone a shoutout for any specified reason. Deploys the shoutout to the Discord's *#shoutout* channel.

## Contributing

Contributing to the Discord bot is both simple and recommended! You may do so in two ways: apply to be an *ACM Community Bot Developer* or simply work on the bot as an open-source developer. In either case, follow the instructions below to setup your development environment and begin contributing to the bot.

  

1. Clone the repository using your preferred command-line interface.
```bash
git clone https://github.com/acmutd/acm-bot.git
```
2. Install the required dependencies specified in the *package.json* file.
```bash
cd acm-bot && npm i
```
3. Familiarize yourself with the code-base and begin making your desired changes. Once you're done, commit your changes and create a pull request. One of the official developers will then review your changes and handle the merging process.
```bash
git add * && git commit -m 'Feature Commit' -m '- added a feature' && git push
```