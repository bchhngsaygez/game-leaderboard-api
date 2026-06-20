const request = require('supertest');
const app = require('../src/app');
const redis = require('../src/config/redis');

const LEADERBOARD_KEY = 'game:leaderboard';

beforeAll(async () => {
  try {
    await redis.connect();
    await redis.flushdb();
  } catch {
    // Redis may already be connected via lazyConnect
  }
});

afterAll(async () => {
  await redis.flushdb();
  await redis.quit();
});

beforeEach(async () => {
  await redis.del(LEADERBOARD_KEY);
});

describe('POST /api/v1/ranks/score', () => {
  it('should add a new user score', async () => {
    const res = await request(app)
      .post('/api/v1/ranks/score')
      .send({ userId: 'alice', score: 100 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe('alice');
    expect(res.body.data.score).toBe(100);
  });

  it('should not update if new score is lower', async () => {
    await redis.zadd(LEADERBOARD_KEY, 200, 'alice');

    const res = await request(app)
      .post('/api/v1/ranks/score')
      .send({ userId: 'alice', score: 100 });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('unchanged');
  });

  it('should update if new score is higher', async () => {
    await redis.zadd(LEADERBOARD_KEY, 100, 'alice');

    const res = await request(app)
      .post('/api/v1/ranks/score')
      .send({ userId: 'alice', score: 200 });

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(200);
  });

  it('should return 400 for missing userId', async () => {
    const res = await request(app)
      .post('/api/v1/ranks/score')
      .send({ score: 100 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for invalid score type', async () => {
    const res = await request(app)
      .post('/api/v1/ranks/score')
      .send({ userId: 'alice', score: 'not-a-number' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/v1/ranks/top', () => {
  beforeEach(async () => {
    await redis.zadd(LEADERBOARD_KEY, 100, 'alice');
    await redis.zadd(LEADERBOARD_KEY, 200, 'bob');
    await redis.zadd(LEADERBOARD_KEY, 50, 'charlie');
  });

  it('should return top players sorted by score descending', async () => {
    const res = await request(app).get('/api/v1/ranks/top');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0].userId).toBe('bob');
    expect(res.body.data[0].score).toBe(200);
    expect(res.body.data[1].userId).toBe('alice');
    expect(res.body.data[2].userId).toBe('charlie');
  });

  it('should respect limit query parameter', async () => {
    const res = await request(app).get('/api/v1/ranks/top?limit=2');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('should include rank numbers', async () => {
    const res = await request(app).get('/api/v1/ranks/top');

    expect(res.body.data[0].rank).toBe(1);
    expect(res.body.data[1].rank).toBe(2);
    expect(res.body.data[2].rank).toBe(3);
  });
});

describe('GET /api/v1/ranks/user/:userId', () => {
  beforeEach(async () => {
    await redis.zadd(LEADERBOARD_KEY, 100, 'alice');
    await redis.zadd(LEADERBOARD_KEY, 200, 'bob');
  });

  it('should return rank and score for existing user', async () => {
    const res = await request(app).get('/api/v1/ranks/user/bob');

    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBe('bob');
    expect(res.body.data.rank).toBe(1);
    expect(res.body.data.score).toBe(200);
  });

  it('should return rank 2 for the lower score user', async () => {
    const res = await request(app).get('/api/v1/ranks/user/alice');

    expect(res.status).toBe(200);
    expect(res.body.data.rank).toBe(2);
    expect(res.body.data.score).toBe(100);
  });

  it('should return 404 for non-existing user', async () => {
    const res = await request(app).get('/api/v1/ranks/user/unknown');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('not found');
  });
});
