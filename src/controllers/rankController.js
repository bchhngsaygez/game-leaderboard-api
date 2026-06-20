const redis = require('../config/redis');

const LEADERBOARD_KEY = 'game:leaderboard';

// POST /api/v1/ranks/score — Thêm / cập nhật điểm của user
const updateScore = async (req, res, next) => {
  try {
    const { userId, score } = req.body;

    if (!userId || typeof score !== 'number') {
      const err = new Error('Invalid input: userId (string) and score (number) are required');
      err.statusCode = 400;
      throw err;
    }

    // ZADD với option 'GT' — chỉ cập nhật nếu điểm mới CAO HƠN điểm cũ
    // Nếu user chưa tồn tại, GT không ảnh hưởng và điểm vẫn được thêm vào
    const added = await redis.zadd(LEADERBOARD_KEY, 'GT', score, userId);

    if (added === 0 && (await redis.zscore(LEADERBOARD_KEY, userId)) > score) {
      // Trường hợp điểm cũ >= điểm mới, không thay đổi gì
      return res.status(200).json({
        success: true,
        message: 'Score unchanged — new score is not higher than current score',
        data: { userId, score: await redis.zscore(LEADERBOARD_KEY, userId) },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Score updated successfully',
      data: { userId, score },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/ranks/top — Lấy Top N người chơi (mặc định 10)
const getTopPlayers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    // ZREVRANGE — lấy danh sách từ cao xuống thấp, kèm điểm số
    const results = await redis.zrevrange(LEADERBOARD_KEY, 0, limit - 1, 'WITHSCORES');

    // Redis trả về mảng dạng [userId, score, userId, score, ...]
    // Chuyển thành mảng object để client dễ xử lý
    const leaderboard = [];
    for (let i = 0; i < results.length; i += 2) {
      leaderboard.push({
        rank: leaderboard.length + 1,
        userId: results[i],
        score: parseFloat(results[i + 1]),
      });
    }

    res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/ranks/user/:userId — Lấy hạng và điểm của 1 user cụ thể
const getUserRank = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // ZREVRANK — trả về index từ 0 (cao nhất), cần +1 để ra thứ hạng thực tế
    const rank = await redis.zrevrank(LEADERBOARD_KEY, userId);
    const score = await redis.zscore(LEADERBOARD_KEY, userId);

    if (rank === null || score === null) {
      const err = new Error(`User "${userId}" not found in leaderboard`);
      err.statusCode = 404;
      throw err;
    }

    res.status(200).json({
      success: true,
      data: {
        userId,
        rank: rank + 1,
        score: parseFloat(score),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { updateScore, getTopPlayers, getUserRank };
