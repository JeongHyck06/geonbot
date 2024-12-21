const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/users');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('베팅')
        .setDescription(
            '플레이어, 뱅커 또는 무승부에 베팅합니다.'
        )
        .addStringOption((option) =>
            option
                .setName('선택')
                .setDescription(
                    '베팅 대상: 플레이어, 뱅커, 무승부'
                )
                .setRequired(true)
                .addChoices(
                    { name: '플레이어', value: 'player' },
                    { name: '뱅커', value: 'banker' },
                    { name: '무승부', value: 'tie' }
                )
        )
        .addIntegerOption((option) =>
            option
                .setName('금액')
                .setDescription('베팅 금액')
                .setRequired(true)
        ),
    async execute(interaction) {
        const bet = interaction.options.getString('선택');
        const amount =
            interaction.options.getInteger('금액');
        const userId = interaction.user.id;

        let user = await User.findOne({ userId });
        if (!user) {
            user = new User({ userId });
            await user.save();
        }

        if (
            user.lastBet &&
            user.lastBet.channelId === interaction.channelId
        ) {
            return interaction.reply(
                '이미 이 게임에 베팅하셨습니다. 결과를 기다려주세요!'
            );
        }

        if (amount <= 0) {
            return interaction.reply(
                '유효한 베팅 금액을 입력하세요.'
            );
        }

        if (user.balance < amount) {
            return interaction.reply('잔액이 부족합니다.');
        }

        // 베팅 정보 저장
        user.lastBet = {
            channelId: interaction.channelId, // 채널 ID 저장
            bet, // 베팅 대상 저장
            amount, // 베팅 금액 저장
        };
        user.balance -= amount;
        await user.save();

        console.log(
            `유저 ${userId}의 베팅 정보:`,
            user.lastBet
        );

        return interaction.reply(
            `당신은 ${bet}에 ${amount} 포인트를 베팅했습니다. 현재 잔액: ${user.balance} 포인트.`
        );
    },
};
