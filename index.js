const {
    Client,
    GatewayIntentBits,
    Collection,
    Events,
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const connectToDatabase = require('./config/database');

dotenv.config();
const token = process.env.DISCORD_TOKEN;
const mongoUri = process.env.MONGO_URI;

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});
client.commands = new Collection();

function loadCommands(directory) {
    const files = fs.readdirSync(directory, {
        withFileTypes: true,
    });

    for (const file of files) {
        const fullPath = path.join(directory, file.name);

        if (file.isDirectory()) {
            loadCommands(fullPath);
        } else if (
            file.isFile() &&
            file.name.endsWith('.js')
        ) {
            const command = require(fullPath);

            if (!command.data || !command.execute) {
                console.error(
                    `Command in ${fullPath} is missing "data" or "execute" property.`
                );
                continue;
            }

            client.commands.set(command.data.name, command);
        }
    }
}

const commandsPath = path.join(__dirname, 'commands');
loadCommands(commandsPath);

client.once(Events.ClientReady, async (c) => {
    console.log(`Loged in as ${c.user.tag}`);

    const guilds = client.guilds.cache.map(
        (guild) => guild.id
    );

    guilds.forEach(async (guildId) => {
        const guild = client.guilds.cache.get(guildId);

        if (guild) {
            try {
                await guild.commands.set(
                    client.commands.map((command) =>
                        command.data.toJSON()
                    )
                );
                console.log(
                    `서버 ${guild.name}에 전용 명령어가 성공적으로 등록되었습니다.`
                );
            } catch (error) {
                console.error(
                    `서버 ${guild.name}에 명령어 등록 중 오류 발생:`,
                    error
                );
            }
        } else {
            console.error(
                `서버를 찾을 수 없습니다. 서버 ID: ${guildId}`
            );
        }
    });
});

// MongoDB 연결 호출
connectToDatabase(mongoUri);

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(
        interaction.commandName
    );

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content:
                '명령을 실행하는 중 오류가 발생했습니다.',
            ephemeral: true,
        });
    }
});

client.login(token);
