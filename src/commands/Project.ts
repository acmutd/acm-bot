import Command, { CommandContext } from '../structures/Command';
import ACMClient from '../structures/Bot';
import { Message, MessageEmbed, Role, OverwriteResolvable, GuildChannel } from 'discord.js';
import Wizard, {
    OptionsWizardNode,
    TextWizardNode,
    ConfirmationWizardNode,
    UserMentionWizardNode,
} from '../utils/Wizard';
import { settings } from '../botsettings';

export default class ProjectCommand extends Command {
    constructor() {
        super({
            name: 'project',
            description: 'A suite of commands that help manage ACM Projects categories.',
            dmWorks: false,
        });
    }
    public async exec({ msg, client, args }: CommandContext) {
        switch (args[0]) {
            case 'create':
                await createProject(client, msg, args);
                break;
            case 'delete':
                var project = await chooseProject(client, msg, args);
                if (project === false) break;
                await deleteProject(client, msg, args, project);
                break;
            case 'members':
                var project = await chooseProject(client, msg, args);
                if (project === false) break;
                await projectMembers(client, msg, args, project);
                break;
            case 'task':
                // project is asked in the task function
                await task(client, msg, args);
                break;
            case 'help':
                await help(client, msg, args);
                break;
            default:
                msg.channel.send(
                    `Use \'${settings.prefix}project help\' to show a list of commands`
                );
                break;
        }
    }
}

// * Misc
async function help(client: ACMClient, msg: Message, args: string[]) {
    var embed = new MessageEmbed();
    embed.setTitle(`**${process.env.PREFIX}project** Command List`);
    embed.setDescription(
        '__🔮 = uses a setup wizard__ (no need for parameters)\n__🔨 = in development__'
    );
    embed.addField(
        `**${process.env.PREFIX}project create**`,
        '🔮 Command used to create a new project.'
    );
    embed.addField(
        `**${process.env.PREFIX}project delete**`,
        '🔮 Command used to delete an existing project.'
    );
    embed.addField(
        `**${process.env.PREFIX}project members**`,
        '🔮 Command used to add members to a project.'
    );
    embed.addField(
        `**${process.env.PREFIX}project task ...**`,
        '🔨 🔮 Command used to create a new task for a project.'
    );
    embed.addField(
        `**${process.env.PREFIX}project help**`,
        `Command used to show all possible commands for \'${process.env.PREFIX}project\'.`
    );
    embed.setFooter('If there seems to be an issue with any of these commands, contact a dev!');
    msg.channel.send({ embed });
}
async function chooseProject(client: ACMClient, msg: Message, args: string[]) {
    var project;
    var projectRoles = kit.projectsInvolved(msg);
    if (projectRoles.length == 0) {
        client.response.emit(
            msg.channel,
            `You're not a part of any projects to add/remove members from! Use \`${settings.prefix}project create\` to create one.`,
            'invalid'
        );
        return false;
    }
    var projectOptions = projectRoles.map((r) => {
        var str = r.name;
        if (kit.isProjectLeader(msg, r)) str += ' 👑';
        return str;
    });
    if (projectRoles.length > 1) {
        let wizard = new Wizard(msg);
        wizard.addNode(
            new OptionsWizardNode(
                wizard,
                {
                    title: '__**Project Commands: Choose a project**__',
                    description:
                        "You're involved in multiple projects. Which project would you like to use commands on? **Type the number**:",
                },
                projectOptions
            )
        );
        let res = await wizard.start();
        if (res === false) return false;
        project = projectRoles[res[0]];
    } else {
        project = projectRoles[0];
    }
    return project;
}

// * Project CRUD series
async function createProject(client: ACMClient, msg: Message, args: string[]) {
    // ask for project name
    var projectOwner = msg.member!;
    let wizard = new Wizard(msg, undefined, { title: '__**Project Creation:**__ ' });
    wizard.addNodes([
        new TextWizardNode(wizard, {
            title: 'Name',
            description: 'Enter a name for your new project',
        }),
    ]);
    let res = await wizard.start();
    if (res === false) return;
    let projectName = res[0];
    // * create a category, a channel, a vc, a role with dot
    // 1. role (needed to set permissions for the role)
    var projectRole = await msg.guild!.roles.create({
        data: { name: `.${projectName}`, mentionable: true },
    });
    projectOwner.roles.add(projectRole);
    // 2. category
    var permissions: OverwriteResolvable[] = [
        {
            id: msg.guild!.id,
            deny: ['VIEW_CHANNEL'],
            type: 'role',
        },
        {
            id: projectRole,
            allow: ['VIEW_CHANNEL'],
            type: 'role',
        },
    ];
    var projectCategory = await msg.guild!.channels.create(projectName, {
        type: 'category',
        permissionOverwrites: permissions,
    });
    // 3. channel
    var desc = `⭐, 👑: ${projectOwner.id}, 🎗️: ${projectRole.id}`;
    var projectChannel = await msg.guild!.channels.create(projectName, {
        type: 'text',
        topic: desc,
        parent: projectCategory,
        permissionOverwrites: permissions,
    });
    var projectVoiceChannel = await msg.guild!.channels.create(projectName + ' VC', {
        type: 'voice',
        parent: projectCategory,
        permissionOverwrites: permissions,
    });

    client.response.emit(
        msg.channel,
        `Successfully created project **.${projectName}**!`,
        'success'
    );
}
async function deleteProject(client: ACMClient, msg: Message, args: string[], projectRole: Role) {
    if (!kit.isProjectLeader(msg, projectRole))
        return client.response.emit(
            msg.channel,
            'Only the __**project leader**__ can delete a project!',
            'warning'
        );
    // * if person is leader
    // CONFIRM
    // var confirmation = await wizard.type.confirmation(
    //     msg,
    //     client,
    //     `⚠️ Are you sure you want to delete the **${projectRole.name}** project? Type **\'confirm\'** to delete, or type **\'quit\'** to quit.`,
    //     "⚠️ You must type either **'confirm'** to confirm that you want to delete this project, or type **'quit'** to quit."
    // );

    let wizard = new Wizard(msg);
    wizard.addNode(
        new ConfirmationWizardNode(wizard, {
            title: `⚠️ | __**Project Deletion**__`,
            description: `Are you sure you want to delete the **${projectRole.name}** project?`,
            color: 'YELLOW',
        })
    );
    let res = await wizard.start();
    if (res === false) return;

    var projectCategory = kit.findCategory(msg, projectRole);
    // 1. delete channels
    projectCategory.children.each((channel: GuildChannel) => {
        channel.delete();
    });
    // 2. delete category
    projectCategory.delete();
    // 3. delete role
    projectRole.delete();

    client.response.emit(
        msg.channel,
        `Successfully deleted the **${projectRole.name}** project!`,
        'success'
    );
}

// * Project Management series
async function projectMembers(client: ACMClient, msg: Message, args: string[], projectRole: Role) {
    // 1. is the person leader
    if (!kit.isProjectLeader(msg, projectRole))
        return client.response.emit(
            msg.channel,
            'Only the __**project leader**__ can delete a project!',
            'warning'
        );
    // 2. wizard node that takes user mentions and adds/removes project role
    let wizard = new Wizard(msg);
    wizard.addNode(
        new UserMentionWizardNode(
            wizard,
            {
                title: '__**Project Members**__: Add/Remove Members [LOOP]',
                description: `Mention a user to add to your project. **TYPE 'done' WHEN YOU ARE DONE ADDING USERS.** \nIf the user __has__ the **${projectRole.name}** project role, then the role will be **removed**.\n If they __don't__, they will be **given** the role.\n `,
            },
            {
                invalidMessage: client.response.build(
                    "You must mention a user (@<username>), or enter 'done' if you're done.",
                    'invalid'
                ),
                loopedCB: (item) => {
                    let user = item[item.length - 1];
                    var member = msg.guild!.members.cache.get(user.id);
                    if (!member) {
                        client.response.emit(
                            msg.channel,
                            `Could not find a member in this server with an id of ${user.id}`,
                            'error'
                        );
                        item.pop();
                        return { item };
                    }
                    if (member.roles.cache.has(projectRole.id)) {
                        member.roles.remove(projectRole);
                        client.response.emit(
                            msg.channel,
                            `Successfully removed **${
                                member.nickname ? member.nickname : user.username
                            }** from project **${projectRole.name}**!`,
                            'success'
                        );
                    } else {
                        member.roles.add(projectRole);
                        client.response.emit(
                            msg.channel,
                            `Successfully added **${
                                member.nickname ? member.nickname : user.username
                            }** from project **${projectRole.name}**!`,
                            'success'
                        );
                    }
                    return { item };
                },
            }
        )
    );
    let res = await wizard.start();
    if (res === false) return;

    client.response.emit(
        msg.channel,
        "Successfully added/removed new people. Ended 'project members' wizard.",
        'success'
    );
}
async function task(client: ACMClient, msg: Message, args: string[]) {
    switch (args[1]) {
        case 'create':
            var project = await chooseProject(client, msg, args);
            if (project === false) break;
            await taskFunctions.create(client, msg, args, project);
            break;
        case 'delete':
            var project = await chooseProject(client, msg, args);
            if (project === false) break;
            await taskFunctions.delete(client, msg, args, project);
            break;
        case 'members':
            var project = await chooseProject(client, msg, args);
            if (project === false) break;
            await taskFunctions.members(client, msg, args, project);
            break;
        case 'help':
            await taskFunctions.help(client, msg, args);
            break;
        default:
            client.response.emit(
                msg.channel,
                `That is not a proper \'task\' command. Try using **\'${settings.prefix}project task help\'** for help.`,
                'invalid'
            );
    }
}
const taskFunctions = {
    create: async (client: ACMClient, msg: Message, args: string[], projectRole: Role) => {
        if (!kit.isProjectLeader(msg, projectRole))
            return client.response.emit(
                msg.channel,
                '[TEMPORARY] Only the __**project leader**__ can create a project task!',
                'warning'
            );
        // // 1. ask for leader
        // var taskLeaderUser = await wizard.type.mention.user(
        //     msg,
        //     client,
        //     false,
        //     msg.author,
        //     {
        //         title: '__**New Project Task: Task Leader**__',
        //         description: 'Mention the new **leader** of this task: ',
        //     },
        //     {
        //         title: '❌ __**New Project Task: Task Leader**__',
        //         description:
        //             'Incorrect response! You must mention the person you want to lead this task (@<username>). You can quit anytime.',
        //     }
        // );
        let wizard = new Wizard(msg, undefined, { title: '__**New Project Task:**__ ' });
        wizard.addNodes([
            new UserMentionWizardNode(wizard, {
                title: 'Task Leader',
                description: 'Mention the new **leader** of this task: ',
            }),
            new UserMentionWizardNode(
                wizard,
                {
                    title: 'Task Members',
                    description:
                        "Add task members by mentioning them. __When you are done, type **'done'**.__",
                },
                {
                    invalidMessage: client.response.build(
                        "Incorrect response! Either mention a user to add to the task, or type **'done'** to indicate that you are done.",
                        'invalid'
                    ),
                    loopedCB: (item) => {
                        const latestItem = item[item.length - 1];
                        const everythingElse = item.slice(0, item.length - 1);
                        if (everythingElse.includes(latestItem)) {
                            client.response.emit(
                                msg.channel,
                                'You have already added that person!',
                                'invalid'
                            );
                            return { item: everythingElse };
                        }
                        return { item };
                    },
                }
            ),
            new TextWizardNode(wizard, {
                title: 'Task Name',
                description: 'Enter the **name** of this task: ',
            }),
        ]);
        let res = await wizard.start();
        if (res === false) return;

        var taskLeader = msg.guild!.members.cache.get(res[0].id);
        // 2. ask for name
        var taskName = await wizard.type.text(msg, client, false, 'untitled', {
            title: '__**New Project Task: Task Name**__',
            description: 'Enter the **name** of this task: ',
        });
        if (taskName === false) return;
        // 3. mention users that will be a part of this task (loop)
        var taskMembers = [];
        do {
            var taskMember = await wizard.default(
                msg,
                client,
                false,
                msg.author,
                {
                    title: '__**New Project Task: Task Members**__',
                    description:
                        "Add task members by mentioning them. __When you are done, type **'done'**.__",
                },
                (response) => {
                    if (response.mentions.users.array().length > 0) {
                        return response.mentions.users.first();
                    } else if (response.content.toLowerCase() == 'done') return 'done';
                },
                {
                    title: '❌ __**New Project Task: Task Members**__',
                    description:
                        "Incorrect response! Either mention a user to add to the task, or type **'done'** to indicate that you are done.",
                }
            );
            if (taskMember === false) return;
            if (taskMember == 'done') break;
            taskMembers.push(taskMember);
        } while (taskMember != 'done');

        // 4. create a channel with permissions just for those members and the project leader
        var allowed = [taskLeader, msg.member, ...taskMembers];
        var perms = [];
        allowed.forEach((mem) => {
            perms.push({
                id: mem,
                allow: ['VIEW_CHANNEL'],
                type: 'member',
            });
        });
        perms.push({
            id: msg.guild.id,
            deny: ['VIEW_CHANNEL'],
            type: 'role',
        });
        var projectCategory = kit.findCategory(msg, projectRole);
        msg.guild.channels.create(taskName, {
            type: 'text',
            topic: '📌',
            parent: projectCategory,
            permissionOverwrites: perms,
        });
    },
    delete: async (client: ACMClient, msg: Message, args: string[], projectRole: Role) => {
        var taskChannel = await kit.chooseTaskChannel(client, msg, projectRole);
        if (taskChannel === false) return;
        // confirm
        var confirmation = await wizard.type.confirmation(
            msg,
            client,
            `⚠️ Are you sure you want to delete the **${taskChannel.name}** task for the **${projectRole.name}** project? Type **\'confirm\'** to delete, or type **\'quit\'** to quit.`,
            "⚠️ You must type either **'confirm'** to confirm that you want to delete this task, or type **'quit'** to quit."
        );
        if (confirmation === false) return;
        taskChannel.delete();
    },
    members: async (client: ACMClient, msg: Message, args: string[], projectRole) => {
        // list all the tasks
        var taskChannel = await kit.chooseTaskChannel(client, msg, projectRole);
        do {
            var user = await wizard.default(
                msg,
                client,
                false,
                msg.author,
                {
                    title: '__**📌 Project Task Members: Add/Remove Members [LOOP]**__',
                    description: `Mention a user to add to your project task. __TYPE **'done'** WHEN YOU ARE DONE ADDING USERS.__ \n\`1.\` If the user is alredy part of the task, then they will be **removed**. \n\`2.\` If they are not part of the tast, then they will be **added**`,
                },
                (response) => {
                    if (response.mentions.users.array().length > 0) {
                        return response.mentions.users.first();
                    } else if (response.content.toLowerCase() == 'done') return 'done';
                },
                {
                    title: '__**❌ Project Task Members: Add/Remove Members [LOOP]**__',
                    description: `**You must mention a user (@<username>)**. __TYPE **'done'** WHEN YOU ARE DONE ADDING USERS.__ \nIf the user __has__ the **${projectRole.name}** project role, then the role will be **removed**.\n If they __don't__, they will be **given** the role.\n You may quit anytime with \'quit\'`,
                }
            );
            if (user === false) return;
            if (user == 'done') {
                msg.channel.send(
                    "Successfully added/removed new people. Ended 'project task members' wizard."
                );
                break;
            }
            var member = msg.guild.members.cache.get(user.id);
            // does person have a permission role already?
            if (!taskChannel.permissionOverwrites.has(member.id)) {
                taskChannel.updateOverwrite(member, { VIEW_CHANNEL: true });
                msg.channel.send(
                    `✅ Successfully added **${
                        member.nickname ? member.nickname : user.username
                    }** to project task **${taskChannel.name}**!`
                );
            } else {
                if (taskChannel.permissionOverwrites.get(member.id).allow.has('VIEW_CHANNEL')) {
                    taskChannel.updateOverwrite(member, { VIEW_CHANNEL: false });
                    msg.channel.send(
                        `✅ Successfully removed **${
                            member.nickname ? member.nickname : user.username
                        }** from project task **${taskChannel.name}**!`
                    );
                } else {
                    taskChannel.updateOverwrite(member, { VIEW_CHANNEL: true });
                    msg.channel.send(
                        `✅ Successfully added **${
                            member.nickname ? member.nickname : user.username
                        }** to project task **${taskChannel.name}**!`
                    );
                }
            }
        } while (user != 'done');
    },
    help: async (client: ACMClient, msg: Message, args: string[]) => {
        var embed = new MessageEmbed();
        embed.setTitle(`**${process.env.PREFIX}project task** Command List`);
        embed.setDescription(
            '__🔮 = uses a setup wizard__ (no need for parameters)\n__🔨 = in development__'
        );
        embed.addField(
            `**${process.env.PREFIX}project task create**`,
            '🔮 Command used to create a new task for a project.'
        );
        embed.addField(
            `**${process.env.PREFIX}project task delete**`,
            '🔮 Command used to delete an existing task for a project.'
        );
        embed.addField(
            `**${process.env.PREFIX}project task members**`,
            '🔮 Command used to add or remove people from a task.'
        );
        embed.addField(
            `**${process.env.PREFIX}project task help**`,
            `Command used to show all possible commands for \'${process.env.PREFIX}project task\'.`
        );
        embed.setFooter('If there seems to be an issue with any of these commands, contact a dev!');
        msg.channel.send({ embed });
    },
};

var kit = {
    isProjectLeader: (msg, projectRole) => {
        var isProjectLeader = false;
        // loop through every channel and find the one where he is leader
        // 1. find project channels
        var categories = msg.guild.channels.cache.filter((c) => c.type == 'category');
        var projectCategory = categories.find((c) => c.permissionOverwrites.get(projectRole.id));
        var description = projectCategory.children
            .filter(
                (c) =>
                    c.type === 'text' &&
                    projectCategory.name.toLowerCase().replace(' ', '-')[0] == c.name[0]
            )
            .first().topic;
        var regex = /\d{18}/g;
        var ids = regex.exec(description);
        ids.forEach((id) => {
            if (id == msg.author.id) isProjectLeader = true;
        });
        return isProjectLeader;
    },
    projectsInvolved: (msg: Message) => {
        // how many roles have '.' in front (how many projects)
        var projectRoles = msg.member!.roles.cache.filter((r: Role) => r.name.startsWith('.'));
        return projectRoles.array();
    },
    findCategory: (msg, projectRole) => {
        var categories = msg.guild.channels.cache.filter((c) => c.type == 'category');
        var projectCategory = categories.find((c) => c.permissionOverwrites.get(projectRole.id));
        return projectCategory;
    },
    findTaskChannels: (msg, projectRole) => {
        var projectCategory = kit.findCategory(msg, projectRole);
        var taskChannels = [];
        projectCategory.children.forEach((channel) => {
            if (channel.type == 'text') {
                if (channel.topic.includes('📌')) taskChannels.push(channel);
            }
        });
        return taskChannels;
    },
    chooseTaskChannel: async (client: ACMClient, msg: Message, projectRole) => {
        var tasks = kit.findTaskChannels(msg, projectRole);
        // if theres only one task then return that task automatically
        if (tasks.length === 1) return tasks[0];
        var taskIndex = await wizard.type.options(
            msg,
            client,
            tasks.map((t) => t.name),
            false,
            { value: 0 },
            {
                title: '__**📌 Project Task Commands: Choose a task**__',
                description:
                    'Your project has multiple tasks. Choose which task you would like to perform the following command on. **Type the number**:',
            },
            {
                title: '__**❌ Project Task Commands: Choose a task**__',
                description:
                    '[You must enter a valid number!] Your project has multiple tasks. Choose which task you would like to perform the following command on. **Type the number**:',
            }
        );
        if (taskIndex === false) return false;
        // return task channel
        return tasks[taskIndex.value];
    },
};
