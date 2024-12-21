const mongoose = require('mongoose');

async function connectToDatabase(mongoUri) {
    try {
        await mongoose.connect(mongoUri);
        console.log('MongoDB에 성공적으로 연결되었습니다!');
    } catch (error) {
        console.error('MongoDB 연결 중 오류 발생:', error);
        process.exit(1);
    }
}

module.exports = connectToDatabase;
