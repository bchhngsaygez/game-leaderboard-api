const express = require('express');
const router = express.Router();
const validate = require('../middlewares/validate');
const { updateScoreSchema, topPlayersQuerySchema, userIdParamSchema } = require('../validators/rankValidator');
const { updateScore, getTopPlayers, getUserRank } = require('../controllers/rankController');

router.post('/score', validate(updateScoreSchema, 'body'), updateScore);
router.get('/top', validate(topPlayersQuerySchema, 'query'), getTopPlayers);
router.get('/user/:userId', validate(userIdParamSchema, 'params'), getUserRank);

module.exports = router;
