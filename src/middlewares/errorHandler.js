// Global error handler — bắt toàn bộ lỗi tập trung, trả về JSON
const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
