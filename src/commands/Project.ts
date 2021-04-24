import Command, { CommandContext } from '../structures/Command';
import ACMClient from '../structures/Bot';
import {
    Message,
    MessageEmbed,
    Role,
    OverwriteResolvable,
    GuildChannel,
    CategoryChannel,
    TextChannel,
} from 'discord.js';
import Wizard, {
    OptionsWizardNode,
    TextWizardNode,
    ConfirmationWizardNode,
    UserMentionWizardNode,
} from '../utils/Wizard';
import { settings } from '../botsettings';
// ACM Projects command suite. Allows officers to create, delete, and manage projects and members.
export default class ProjectCommand extends Command {
    constructor() {
        super({
            name: 'project',
            description: 'A suite of commands that help manage ACM Projects categories.',
            dmWorks: false,
        });
    }
    /**
     * Standard Command Executor
     * @param param0 Command Arguments
     * @returns Promise
     */
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
    embed.setTitle(`**${settings.prefix}project** Command List`);
    embed.setDescription(
        '__🔮 = uses a setup wizard__ (no need for parameters)\n__🔨 = in development__'
    );
    embed.addField(
        `**${settings.prefix}project create**`,
        '🔮 Command used to create a new project.'
    );
    embed.addField(
        `**${settings.prefix}project delete**`,
        '🔮 Command used to delete an existing project.'
    );
    embed.addField(
        `**${settings.prefix}project members**`,
        '🔮 Command used to add members to a project.'
    );
    embed.addField(
        `**${settings.prefix}project task ...**`,
        '🔨 🔮 Command used to create a new task for a project.'
    );
    embed.addField(
        `**${settings.prefix}project help**`,
        `Command used to show all possible commands for \'${settings.prefix}project\'.`
    );
    embed.setFooter('If there seems to be an issue with any of these commands, contact a dev!');
    msg.channel.send({ embed });
}
async function chooseProject(
    client: ACMClient,
    msg: Message,
    args: string[]
): Promise<Role | false> {
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
        const res = await wizard.start();
        if (res === false) return false;
        project = projectRoles[res[0].value];
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
    const res = await wizard.start();
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
    //     msg
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
    const res = await wizard.start();
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
                            }** to project **${projectRole.name}**!`,
                            'success'
                        );
                    }
                    return { item };
                },
            }
        )
    );
    const res = await wizard.start();
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

        let wizard = new Wizard(msg, undefined, { title: '__**New Project Task:**__ ' });
        wizard.addNodes([
            // task name
            new TextWizardNode(wizard, {
                title: 'Task Name',
                description: 'Enter the **name** of this task: ',
            }),
            // task leader
            new UserMentionWizardNode(wizard, {
                title: 'Task Leader',
                description: 'Mention the new **leader** of this task: ',
            }),
            // task members
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
        ]);
        const res = await wizard.start();
        if (res === false) return;

        var taskLeader = msg.guild!.members.cache.get(res[1].id);

        // 4. create a channel with permissions just for those members and the project leader
        var allowed = [taskLeader, msg.member, ...res[2]];
        var perms: OverwriteResolvable[] = [];
        allowed.forEach((mem) => {
            perms.push({
                id: mem,
                allow: ['VIEW_CHANNEL'],
                type: 'member',
            });
        });
        perms.push({
            id: msg.guild!.id,
            deny: ['VIEW_CHANNEL'],
            type: 'role',
        });
        var projectCategory = kit.findCategory(msg, projectRole);
        msg.guild!.channels.create(res[0], {
            type: 'text',
            topic: '📌',
            parent: projectCategory,
            permissionOverwrites: perms,
        });

        client.response.emit(
            msg.channel,
            `Successfully created the **${res[0]}** task for the **${projectRole.name}** project`,
            'success'
        );
    },
    delete: async (client: ACMClient, msg: Message, args: string[], projectRole: Role) => {
        var taskChannel = await kit.chooseTaskChannel(client, msg, projectRole);
        if (taskChannel === false) return;
        // confirm
        let wizard = new Wizard(msg);
        wizard.addNode(
            new ConfirmationWizardNode(wizard, {
                title: `⚠️ | __**Task Deletion**__`,
                description: `Are you sure you want to delete the **${taskChannel.name}** task for the **${projectRole.name}** project?`,
                color: 'YELLOW',
            })
        );
        const res = await wizard.start();
        if (res === false) return;
        taskChannel.delete();
        client.response.emit(
            msg.channel,
            `Successfully deleted the **${taskChannel.name}** task for the **${projectRole.name}** project`,
            'success'
        );
    },
    members: async (client: ACMClient, msg: Message, args: string[], projectRole: Role) => {
        // list all the tasks
        var taskChannel = await kit.chooseTaskChannel(client, msg, projectRole);
        if (taskChannel === false) return;

        let wizard = new Wizard(msg);
        wizard.addNode(
            new UserMentionWizardNode(
                wizard,
                {
                    title: `__**Project Task Members:**__ Add/Remove Members [LOOP]`,
                    description: `Mention a user to add to your project task. __TYPE **'done'** WHEN YOU ARE DONE ADDING USERS.__ \n\`1.\` If the user is alredy part of the task, then they will be **removed**. \n\`2.\` If they are not part of the tast, then they will be **added**`,
                },
                {
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
                        if (taskChannel === false) return { item };
                        if (!taskChannel.permissionOverwrites.has(member.id)) {
                            taskChannel.updateOverwrite(member, { VIEW_CHANNEL: true });
                            client.response.emit(
                                msg.channel,
                                `Successfully added **${
                                    member.nickname ? member.nickname : user.username
                                }** to project task **${projectRole.name}**!`,
                                'success'
                            );
                        } else {
                            if (
                                taskChannel.permissionOverwrites
                                    .get(member.id)!
                                    .allow.has('VIEW_CHANNEL')
                            ) {
                                taskChannel.updateOverwrite(member, { VIEW_CHANNEL: false });
                                client.response.emit(
                                    msg.channel,
                                    `Successfully removed **${
                                        member.nickname ? member.nickname : user.username
                                    }** from project **${projectRole.name}**!`,
                                    'success'
                                );
                            } else {
                                taskChannel.updateOverwrite(member, { VIEW_CHANNEL: true });
                                client.response.emit(
                                    msg.channel,
                                    `Successfully added **${
                                        member.nickname ? member.nickname : user.username
                                    }** to project task **${projectRole.name}**!`,
                                    'success'
                                );
                            }
                        }
                        return { item };
                    },
                }
            )
        );
        const res = await wizard.start();
        if (res === false) return;

        client.response.emit(
            msg.channel,
            "Successfully added/removed new people to task. Ended 'project task members' wizard.",
            'success'
        );
    },
    help: async (client: ACMClient, msg: Message, args: string[]) => {
        var embed = new MessageEmbed();
        embed.setTitle(`**${settings.prefix}project task** Command List`);
        embed.setDescription(
            '__🔮 = uses a setup wizard__ (no need for parameters)\n__🔨 = in development__'
        );
        embed.addField(
            `**${settings.prefix}project task create**`,
            '🔮 Command used to create a new task for a project.'
        );
        embed.addField(
            `**${settings.prefix}project task delete**`,
            '🔮 Command used to delete an existing task for a project.'
        );
        embed.addField(
            `**${settings.prefix}project task members**`,
            '🔮 Command used to add or remove people from a task.'
        );
        embed.addField(
            `**${settings.prefix}project task help**`,
            `Command used to show all possible commands for \'${settings.prefix}project task\'.`
        );
        embed.setFooter('If there seems to be an issue with any of these commands, contact a dev!');
        msg.channel.send({ embed });
    },
};

var kit = {
    isProjectLeader: (msg: Message, projectRole: Role) => {
        let isProjectLeader = false;
        // loop through every channel and find the one where he is leader
        // 1. find project channels
        const categories = msg.guild!.channels.cache.filter((c) => c.type == 'category');
        const projectCategory = categories.find((c) =>
            c.permissionOverwrites.get(projectRole.id) ? true : false
        ) as CategoryChannel;
        if (!projectCategory) return isProjectLeader;
        const projectMainChannel = projectCategory.children
            .filter(
                (c: GuildChannel) =>
                    c.type === 'text' &&
                    projectCategory.name.toLowerCase().replace(' ', '-')[0] == c.name[0]
            )
            .first() as TextChannel;
        if (!projectMainChannel) {
            msg.channel.send(
                `The main channel of the **${projectCategory.name}** project was deleted!`
            );
            return isProjectLeader;
        }
        var regex = /\d{18}/g;
        var ids = regex.exec(projectMainChannel.topic ?? '') ?? [];
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
    findCategory: (msg: Message, projectRole: Role) => {
        var categories = msg.guild!.channels.cache.filter((c) => c.type == 'category');
        var projectCategory = categories.find((c) =>
            c.permissionOverwrites.get(projectRole.id) ? true : false
        ) as CategoryChannel;
        return projectCategory;
    },
    findTaskChannels: (msg: Message, projectRole: Role) => {
        var projectCategory = kit.findCategory(msg, projectRole);
        let taskChannels: TextChannel[] = [];
        projectCategory.children.forEach((channel: GuildChannel) => {
            if (channel.type == 'text') {
                const text = channel as TextChannel;
                if (text.topic && text.topic.includes('📌')) taskChannels.push(text);
            }
        });
        return taskChannels;
    },
    chooseTaskChannel: async (
        client: ACMClient,
        msg: Message,
        projectRole: Role
    ): Promise<TextChannel | false> => {
        var tasks = kit.findTaskChannels(msg, projectRole);
        if (tasks.length == 0) {
            client.response.emit(
                msg.channel,
                `The '**${projectRole.name}**' project does not have any tasks.`,
                'invalid'
            );
            return false;
        }
        // if theres only one task then return that task automatically
        if (tasks.length === 1) return tasks[0];
        let wizard = new Wizard(msg);
        wizard.addNode(
            new OptionsWizardNode(
                wizard,
                {
                    title: '__**Project Task Commands:**__ Choose a task',
                    description:
                        'Your project has multiple tasks. Choose which task you would like to perform the following command on. **Type the number**:',
                },
                tasks.map((t) => t.name)
            )
        );
        const res = await wizard.start();
        if (res === false) return false;
        // return task channel
        return tasks[res[0].value];
    },
};
