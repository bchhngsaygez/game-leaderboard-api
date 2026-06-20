const Joi = require('joi');

const updateScoreSchema = Joi.object({
  userId: Joi.string().required().trim().min(1).max(50)
    .messages({
      'string.empty': 'userId must not be empty',
      'any.required': 'userId is required',
    }),
  score: Joi.number().required().min(0)
    .messages({
      'number.base': 'score must be a number',
      'any.required': 'score is required',
    }),
});

const topPlayersQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10),
});

const userIdParamSchema = Joi.object({
  userId: Joi.string().required().trim().min(1).max(50),
});

module.exports = { updateScoreSchema, topPlayersQuerySchema, userIdParamSchema };
