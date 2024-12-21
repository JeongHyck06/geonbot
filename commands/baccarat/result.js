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

        // 초기 메시지
        let response = `결과는 **${result}**입니다!\n\n플레이어 카드: ${playerCards.join(
            ', '
        )}\n뱅커 카드: ${bankerCards.join(', ')}\n\n`;

        // console.log('결과 계산 완료:', {
        //     result,
        //     playerCards,
        //     bankerCards,
        // });

        try {
            // 모든 유저 데이터 확인
            const players = await User.find();
            console.log(
                '데이터베이스에서 가져온 플레이어 목록:',
                players
            );

            for (const user of players) {
                // console.log('현재 처리 중인 유저:', user);

                // 유저가 해당 채널에 베팅한 기록이 있는지 확인
                if (
                    !user.lastBet ||
                    user.lastBet.channelId !==
                        interaction.channelId
                ) {
                    // console.log(
                    //     `<@${user.userId}>는 이 채널에 베팅하지 않았습니다.`
                    // );
                    continue;
                }

                const { bet, amount } = user.lastBet;
                // console.log(
                //     `<@${user.userId}>의 베팅 정보:`,
                //     { bet, amount }
                // );

                // 베팅 결과 처리
                if (bet === result) {
                    const winnings = calculateWinnings(
                        result,
                        amount
                    );
                    user.balance += winnings;
                    response += `<@${user.userId}> **승리!** ${amount} 포인트를 베팅하고 ${winnings} 포인트를 획득했습니다.\n`;
                    // console.log(
                    //     `<@${user.userId}> 승리. 현재 잔액: ${user.balance}`
                    // );
                } else {
                    response += `<@${user.userId}> **패배.** ${amount} 포인트를 잃었습니다.\n`;
                    // console.log(
                    //     `<@${user.userId}> 패배. 현재 잔액: ${user.balance}`
                    // );
                }

                // 잔액 출력
                response += `현재 잔액: ${user.balance} 포인트.\n\n`;

                // 베팅 정보 초기화
                user.lastBet = null;
                await user.save();
            }

            // 결과 응답
            console.log('최종 응답 메시지:', response);
            return interaction.reply(response);
        } catch (error) {
            console.error('결과 처리 중 오류:', error);
            return interaction.reply(
                '결과를 처리하는 중 오류가 발생했습니다. 관리자에게 문의하세요.'
            );
        }
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
        return Math.floor(amount * 1.95);
    if (result === 'tie') return amount * 8;
}
