// src/validators/index.js
const Joi = require('joi');

const registerSchema = Joi.object({
  // batch is an ordinal number (Batch 1, Batch 15, Batch 22...) NOT a calendar year
  batch: Joi.number().integer().min(1).max(999).required()
    .messages({
      'any.required': 'Batch is required',
      'number.base': 'Batch must be a number',
      'number.integer': 'Batch must be a whole number',
      'number.min': 'Batch must be at least 1',
      'number.max': 'Batch must be 999 or less',
    }),
  full_name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  phone_number: Joi.string().trim().min(7).max(20).required(),
  alternative_phone: Joi.string().trim().min(7).max(20).optional().allow('', null),
  job_title: Joi.string().trim().max(100).optional().allow('', null),
  organisation: Joi.string().trim().max(200).optional().allow('', null),
  organisation_address: Joi.string().trim().max(300).optional().allow('', null),
  // Accept both real booleans AND the strings "true"/"false" from radio buttons
  notify_events: Joi.boolean().truthy('true').falsy('false').required()
    .messages({ 'any.required': 'notify_events selection is required' }),
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

const postSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  content: Joi.string().min(10).required(),
  published: Joi.boolean().truthy('true').falsy('false').optional(),
});

const updatePostSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).optional(),
  content: Joi.string().min(10).optional(),
  published: Joi.boolean().truthy('true').falsy('false').optional(),
});

const eventSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  description: Joi.string().optional().allow(''),
  event_date: Joi.date().iso().required(),
  location: Joi.string().trim().max(200).optional().allow(''),
});

const updateEventSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).optional(),
  description: Joi.string().optional().allow(''),
  event_date: Joi.date().iso().optional(),
  location: Joi.string().trim().max(200).optional().allow(''),
});

const committeeSchema = Joi.object({
  acting_year: Joi.number().integer().min(1990).max(2100).required(),
});

const assignMemberSchema = Joi.object({
  committee_id: Joi.string().uuid().required(),
  member_id: Joi.string().uuid().required(),
  position: Joi.string().valid('PRESIDENT', 'GENERAL_SECRETARY').required(),
});

const contactSchema = Joi.object({
  name:    Joi.string().trim().min(2).max(100).required(),
  email:   Joi.string().email().required(),
  subject: Joi.string().trim().min(3).max(200).required(),
  message: Joi.string().trim().min(10).max(5000).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  postSchema,
  updatePostSchema,
  eventSchema,
  updateEventSchema,
  committeeSchema,
  assignMemberSchema,
  contactSchema,
};