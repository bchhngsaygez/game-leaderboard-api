const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });

    if (error) {
      const messages = error.details.map((d) => d.message).join('; ');
      const err = new Error(messages);
      err.statusCode = 400;
      return next(err);
    }

    req[source] = value;
    next();
  };
};

module.exports = validate;
