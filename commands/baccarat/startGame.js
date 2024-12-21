const { SlashCommandBuilder } = require('discord.js');
const gameData = require('../../data/gameData'); // gameData 불러오기

module.exports = {
    data: new SlashCommandBuilder()
        .setName('게임시작')
        .setDescription('새로운 바카라 게임을 시작합니다.'),
    async execute(interaction) {
        if (gameData[interaction.channelId]) {
            return interaction.reply(
                '이미 진행 중인 게임이 있습니다!'
            );
        }

        gameData[interaction.channelId] = {
            players: {},
            deck: shuffleDeck(),
        };

        return interaction.reply(
            '새로운 바카라 게임이 시작되었습니다! /베팅 명령어로 베팅을 진행하세요.'
        );
    },
};

// 유틸리티 함수
function shuffleDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
    ];
    const deck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push(rank);
        }
    }
    return deck.sort(() => Math.random() - 0.5);
}
