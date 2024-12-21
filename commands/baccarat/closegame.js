const { SlashCommandBuilder } = require('discord.js');
const gameData = require('../../data/gameData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('게임닫기')
        .setDescription(
            '현재 진행 중인 게임을 종료합니다.'
        ),
    async execute(interaction) {
        if (!gameData[interaction.channelId]) {
            return interaction.reply(
                '현재 진행 중인 게임이 없습니다.'
            );
        }

        delete gameData[interaction.channelId];
        return interaction.reply(
            '게임이 성공적으로 종료되었습니다.'
        );
    },
};
