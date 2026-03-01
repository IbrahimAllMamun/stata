// src/validators/index.js
const Joi = require('joi');

const registerSchema = Joi.object({
  batch: Joi.number().integer().min(1990).max(2100).required()
    .messages({ 'any.required': 'Batch is required', 'number.base': 'Batch must be a number' }),
  full_name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  phone_number: Joi.string().trim().min(7).max(20).required(),
  alternative_phone: Joi.string().trim().min(7).max(20).optional().allow(''),
  job_title: Joi.string().trim().max(100).optional().allow(''),
  organisation: Joi.string().trim().max(200).optional().allow(''),
  organisation_address: Joi.string().trim().max(300).optional().allow(''),
  notify_events: Joi.boolean().required()
    .messages({ 'any.required': 'notify_events selection is required' }),
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

const postSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  content: Joi.string().min(10).required(),
  published: Joi.boolean().optional(),
});

const updatePostSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).optional(),
  content: Joi.string().min(10).optional(),
  published: Joi.boolean().optional(),
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

module.exports = {
  registerSchema,
  loginSchema,
  postSchema,
  updatePostSchema,
  eventSchema,
  updateEventSchema,
  committeeSchema,
  assignMemberSchema,
};
