const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/users');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('결과보기')
        .setDescription(
            '임의의 결과를 생성하고 베팅 결과를 확인합니다.'
        ),
    async execute(interaction) {
        const deck = shuffleDeck();

        // 결과 생성
        const { result, playerCards, bankerCards } =
            dealAndDetermineResult(deck);

        let response = `결과는 **${result}**입니다!\n\n플레이어 카드: ${playerCards.join(
            ', '
        )}\n뱅커 카드: ${bankerCards.join(', ')}\n\n`;

        const players = await User.find(); // 모든 유저 데이터 가져오기

        for (const user of players) {
            // 유저가 현재 채널에 베팅한 적이 있는지 확인
            if (
                !user.lastBet ||
                user.lastBet.channelId !==
                    interaction.channelId
            ) {
                continue;
            }

            const { bet, amount } = user.lastBet;

            if (bet === result) {
                // 승리 시 배당금을 계산하고 추가
                const winnings = calculateWinnings(
                    result,
                    amount
                );
                user.balance += winnings;
                response += `<@${user.userId}> **승리!** ${amount} 포인트를 베팅하고 ${winnings} 포인트를 획득했습니다.\n`;
            } else {
                response += `<@${user.userId}> **패배.** ${amount} 포인트를 잃었습니다.\n`;
            }

            // 업데이트된 잔액 표시
            response += `현재 잔액: ${user.balance} 포인트.\n\n`;

            // 베팅 데이터 초기화
            user.lastBet = null;
            await user.save();
        }

        return interaction.reply(response);
    },
};

// 유틸리티 함수들
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

function dealAndDetermineResult(deck) {
    const playerCards = [deck.pop(), deck.pop()];
    const bankerCards = [deck.pop(), deck.pop()];

    const playerScore = calculateScore(playerCards);
    const bankerScore = calculateScore(bankerCards);

    let result = '';
    if (playerScore > bankerScore) result = 'player';
    else if (bankerScore > playerScore) result = 'banker';
    else result = 'tie';

    return { result, playerCards, bankerCards };
}

function calculateScore(cards) {
    const total = cards.reduce(
        (sum, card) => sum + Math.min(card, 10),
        0
    );
    return total % 10;
}

function calculateWinnings(result, amount) {
    if (result === 'player') return amount * 2;
    if (result === 'banker')
        return Math.floor(amount * 1.95); // 5% 수수료
    if (result === 'tie') return amount * 8;
}
