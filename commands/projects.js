const toolkit = require('../toolkit.js');
const wizard = require('../wizard.js');
const { MessageEmbed } = require('discord.js');

// * i dont feel like using database zzz
// * The goal for this entire command set is to never need to use a database,
// * and to find ways to store important data on Discord itself.

module.exports.run = async (client, msg, args) => {

    client.indicators.usingCommand.push(msg.author.id);
    function removeID() {
        client.indicators.usingCommand = client.indicators.usingCommand.filter(user => user != msg.author.id);
    }
    
    // * if the user is involved with more than 1 project, ask what project they are referencing
    switch(args[0]) {
        case 'create':
            await createProject(client, msg, args);
            break;
        case 'delete':
            var project = await chooseProject(client, msg, args);
            if(project === false) break;
            await deleteProject(client, msg, args, project);
            break;
        case 'members':
            var project = await chooseProject(client, msg, args);
            if(project === false) break;
            await projectMembers(client, msg, args, project);
            break;
        case 'task':
            var project = await chooseProject(client, msg, args);
            if(project === false) break;
            await task(client, msg, args, project);
            break;
        case 'help':
            await help(client, msg, args);
            break;
        default: 
            msg.channel.send(`Use \'${process.env.PREFIX}project help\' to show a list of commands`);
            break;
    }
    removeID();
}
// * Misc
async function help(client, msg, args) {
    var embed = new MessageEmbed();
    embed.setTitle(`**${process.env.PREFIX}project** Command List`);
    embed.setDescription('__🔮 = uses a setup wizard__ (no need for parameters)\n__🔨 = in development__')
    embed.addField(`**${process.env.PREFIX}project create**`, '🔮 Command used to create a new project.')
    embed.addField(`**${process.env.PREFIX}project delete**`, '🔮 Command used to delete an existing project.')
    embed.addField(`**${process.env.PREFIX}project members**`, '🔮 Command used to add members to a project.')
    embed.addField(`**${process.env.PREFIX}project task ...**`, '🔨 🔮 Command used to create a new task for a project.')
    embed.addField(`**${process.env.PREFIX}project help**`, `Command used to show all possible commands for \'${process.env.PREFIX}project\'.`)
    embed.setFooter('If there seems to be an issue with any of these commands, contact a dev!');
    msg.channel.send({embed});
}
async function chooseProject(client, msg, args) {
    var project;
    var projectRoles = kit.projectsInvolved(msg);
    var projectOptions = projectRoles.map(r => {
        var str = r.name;
        if (kit.isProjectLeader(msg, r)) str += " 👑";
        return str;
    })
    if(projectRoles.length > 1) {
        var choice = await wizard.type.options(
            msg, client, projectOptions, false, 0,
            {
                title: "__**Project Commands: Choose a project**__",
                description: "You're involved in multiple projects. Which project would you like to use commands on? **Type the number**:"
            },
        );
        if(choice === false) return false;
        project = projectRoles[choice.value];
    } else { project = projectRoles[0]; }
    return project;
}

// * Project CRUD series
async function createProject(client, msg, args) {
    // ask for project name
    var projectOwner = msg.member;
    var projectName = await wizard.type.text(
        msg, client, false, "", {
            title: "__**Project Creation: Name**__",
            description: "Enter a name for your new project"
        }
    );
    if(projectName === false) return;

    // * create a category, a channel, a vc, a role with dot
    // 1. role (needed to set permissions for the role)
    var projectRole = await msg.guild.roles.create({data: {name: `.${projectName}`, mentionable: true}})
    projectOwner.roles.add(projectRole)
    // 2. category
    var permissions = [
        {
            id: msg.guild.id,
            deny: ['VIEW_CHANNEL'],
            type: 'role'
        }, 
        {
            id: projectRole,
            allow: ['VIEW_CHANNEL'],
            type: 'role'
        }
    ]
    var projectCategory = await msg.guild.channels.create(projectName, {type: 'category', permissionOverwrites: permissions});
    // 3. channel
    var desc = `⭐, 👑: ${projectOwner.id}, 🎗️: ${projectRole.id}`;
    var projectChannel = await msg.guild.channels.create(projectName, {type: 'text', topic: desc, parent: projectCategory, permissionOverwrites: permissions});
    var projectVoiceChannel = await msg.guild.channels.create(projectName + " VC", {type: 'voice', parent: projectCategory, permissionOverwrites: permissions});
}
async function deleteProject(client, msg, args, projectRole) {
    if(!kit.isProjectLeader(msg, projectRole)) return msg.channel.send('⚠️ Only the __**project leader**__ can delete a project!')
    // * if person is leader
    // CONFIRM
    var confirmation = await wizard.type.confirmation(msg, client, 
        `⚠️ Are you sure you want to delete the **${projectRole.name}** project? Type **\'confirm\'** to delete, or type **\'quit\'** to quit.`,
        "⚠️ You must type either **\'confirm\'** to confirm that you want to delete this project, or type **\'quit\'** to quit.");
    if(confirmation === false) return;
    var projectCategory = kit.findCategory(msg, projectRole)
    // 1. delete channels
    projectCategory.children.each(channel => {
        channel.delete();
    })
    // 2. delete category
    projectCategory.delete();
    // 3. delete role
    projectRole.delete();

    msg.channel.send(`Successfully deleted the **${projectRole.name}** project!`)
}

// * Project Management series
async function projectMembers(client, msg, args, projectRole) {
    // 1. is the person leader
    if(!kit.isProjectLeader(msg, projectRole)) return msg.channel.send('⚠️ Only the __**project leader**__ can add/remove project members!')
    // 2. wizard node that takes user mentions and adds/removes project role
    do {
        var user = await wizard.default(
            msg, client, false, msg.author, 
            {
                title: "__**Project Members: Add/Remove Members [LOOP]**__",
                description: `Mention a user to add to your project. **TYPE 'done' WHEN YOU ARE DONE ADDING USERS.** \nIf the user __has__ the **${projectRole.name}** project role, then the role will be **removed**.\n If they __don't__, they will be **given** the role.\n `
            },
            (response) => {
                if(response.mentions.users.array().length > 0) {
                    return response.mentions.users.first();
                } else if (response.content.toLowerCase() == 'done') return 'done'
            },
            {
                title: "__**❌ Project Members: Add/Remove Members [LOOP]**__",
                description: `**You must mention a user (@<username>)**. **TYPE 'done' WHEN YOU ARE DONE.** \nIf the user __has__ the **${projectRole.name}** project role, then the role will be **removed**.\n If they __don't__, they will be **given** the role.\n You may quit anytime with \'quit\'`
            },
        );
        if(user === false) return;
        if(user == 'done') { msg.channel.send('Successfully added/removed new people. Ended \'project members\' wizard.'); break;}
        var member = msg.guild.members.cache.get(user.id);
        if(member.roles.cache.has(projectRole.id)) {
            member.roles.remove(projectRole);
            msg.channel.send(`✅ Successfully removed **${member.nickname ? member.nickname : user.username}** from project **${projectRole.name}**!`)
        }
        else {
            member.roles.add(projectRole)
            msg.channel.send(`✅ Successfully added **${member.nickname ? member.nickname : user.username}** to project **${projectRole.name}**!`)
        }
    } while (user != 'done');
}
async function task(client, msg, args, projectRole) {
    switch(args[1]) {
        case 'create':
            await taskFunctions.create(client, msg, args, projectRole)
            break;
        default:
            msg.channel.send(`❌ That is not a proper \'task\' command. Try using **\'${process.env.PREFIX}project task help\'** for help.`)
    }
}
const taskFunctions = {
    create: async (client, msg, args, projectRole) => {
        if(!kit.isProjectLeader(msg, projectRole)) return msg.channel.send('⚠️ [TEMPORARILY] Only the __**project leader**__ can create a project task!')
        // 1. ask for leader
        var taskLeaderUser = await wizard.type.mention.user(
            msg, client, false, msg.author, 
            {
                title: "__**New Project Task: Task Leader**__",
                description: "Mention the new **leader** of this task: "
            },
            {
                title: "❌ __**New Project Task: Task Leader**__",
                description: "Incorrect response! You must mention the person you want to lead this task (@<username>). You can quit anytime."
            }
        );
        if(taskLeaderUser === false) return;
        var taskLeader = msg.guild.members.cache.get(taskLeaderUser.id);
        // 2. ask for name
        var taskName = await wizard.type.text(
            msg, client, false, "untitled",
            {
                title: "__**New Project Task: Task Name**__",
                description: "Enter the **name** of this task: "
            },);
        if(taskName === false) return;
        // 3. mention users that will be a part of this task (loop)
        var taskMembers = [];
        do {
            var taskMember = await wizard.default(
                msg, client, false, msg.author, 
                {
                    title: "__**New Project Task: Task Members**__",
                    description: "Add task members by mentioning them. __When you are done, type **'done'**.__"
                },
                (response) => {
                    if(response.mentions.users.array().length > 0) {
                        return response.mentions.users.first();
                    } else if (response.content.toLowerCase() == 'done') return 'done'
                },
                {
                    title: "❌ __**New Project Task: Task Members**__",
                    description: "Incorrect response! Either mention a user to add to the task, or type **'done'** to indicate that you are done."
                }
            );
            if(taskMember === false) return;
            if(taskMember == 'done') break;
            taskMembers.push(taskMember);
        } while (taskMember != 'done');

        // 4. create a channel with permissions just for those members and the project leader
        var perms = [taskLeader, msg.member];
        taskMembers.forEach(mem => {
            perms.push({
                id: mem,
                allow: ['VIEW_CHANNEL'],
                type: 'member'
            })
        });
        perms.push({
            id: msg.guild.id,
            deny: ['VIEW_CHANNEL'],
            type: 'role'
        })
        var projectCategory = kit.findCategory(msg, projectRole);
        msg.guild.channels.create(taskName, {type: 'text', parent: projectCategory, permissionOverwrites: perms})
    },
}

var kit = {
    isProjectLeader: (msg, projectRole) => {
        var isProjectLeader = false;
        // loop through every channel and find the one where he is leader
        // 1. find project channels
        var categories = msg.guild.channels.cache.filter(c => c.type == 'category');
        var projectCategory = categories.find(c => c.permissionOverwrites.get(projectRole.id));
        var description = projectCategory.children.first().topic;
        var regex = /\d{18}/g;
        var ids = regex.exec(description);
        ids.forEach(id => {
            if(id == msg.author.id) isProjectLeader = true;
        });
        return isProjectLeader;
    },
    projectsInvolved: (msg) => {
        // how many roles have '.' in front (how many projects)
        var projectRoles = msg.member.roles.cache.filter(r => r.name.startsWith('.')); 
        return projectRoles.array();
    },
    findCategory: (msg, projectRole) => {
        var categories = msg.guild.channels.cache.filter(c => c.type == 'category');
        var projectCategory = categories.find(c => c.permissionOverwrites.get(projectRole.id));
        return projectCategory;
    }
}

module.exports.info = {
    name: 'project'
}