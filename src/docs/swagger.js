const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Game Leaderboard API',
      version: '1.0.0',
      description: 'Real-time leaderboard API sử dụng Redis Sorted Sets — hiệu suất cao, phù hợp cho game mobile/web.',
      contact: {
        name: 'Developer',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local development' },
    ],
    components: {
      schemas: {
        ScoreUpdateRequest: {
          type: 'object',
          required: ['userId', 'score'],
          properties: {
            userId: { type: 'string', example: 'player1', description: 'ID của người chơi' },
            score: { type: 'number', example: 1500, description: 'Điểm số mới' },
          },
        },
        LeaderboardEntry: {
          type: 'object',
          properties: {
            rank: { type: 'integer', example: 1 },
            userId: { type: 'string', example: 'player1' },
            score: { type: 'number', example: 1500 },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
          },
        },
      },
    },
    paths: {
      '/api/v1/ranks/score': {
        post: {
          tags: ['Leaderboard'],
          summary: 'Cập nhật / thêm điểm người chơi',
          description: 'Dùng ZADD với option GT — chỉ cập nhật nếu điểm mới cao hơn điểm cũ.',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ScoreUpdateRequest' } } },
          },
          responses: {
            200: { description: 'Cập nhật thành công', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            400: { description: 'Dữ liệu đầu vào không hợp lệ', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/api/v1/ranks/top': {
        get: {
          tags: ['Leaderboard'],
          summary: 'Lấy Top N người chơi',
          description: 'Dùng ZREVRANGE WITHSCORES — danh sách từ cao xuống thấp.',
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 }, description: 'Số lượng người chơi (mặc định 10)' },
          ],
          responses: {
            200: {
              description: 'Danh sách top',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'array', items: { $ref: '#/components/schemas/LeaderboardEntry' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/ranks/user/{userId}': {
        get: {
          tags: ['Leaderboard'],
          summary: 'Tra cứu hạng và điểm của 1 người chơi',
          description: 'Dùng ZREVRANK + ZSCORE. Nếu không tìm thấy trả về 404.',
          parameters: [
            { name: 'userId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID của người chơi' },
          ],
          responses: {
            200: { description: 'Thông tin người chơi', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            404: { description: 'Không tìm thấy user', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Game Leaderboard API Docs',
  }));
};

module.exports = setupSwagger;
