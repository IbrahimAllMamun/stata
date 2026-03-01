// src/middlewares/validate.js
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, convert: true });
  if (error) {
    const messages = error.details.map((d) => d.message);
    return res.status(400).json({ success: false, message: 'Validation error', errors: messages });
  }
  // Replace req.body with the coerced values (e.g. "true" -> true, "2020" -> 2020)
  req.body = value;
  next();
};

module.exports = validate;