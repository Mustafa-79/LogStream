// src/models/Group.ts
import mongoose, { Document, Schema } from 'mongoose';
import Joi, { ValidationResult } from 'joi';

// =========================
// Interface for Group Document
// =========================
export interface IGroup extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
  deleted: boolean;
}

// =========================
// Mongoose Schema
// =========================
const GroupSchema = new Schema<IGroup>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  active: {
    type: Boolean,
    default: true,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});

// =========================
// Middleware - pre-save hook
// =========================
GroupSchema.pre<IGroup>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// =========================
// Mongoose Model
// =========================
export const Group = mongoose.model<IGroup>('Group', GroupSchema);

// =========================
// Validation
// =========================
export interface GroupInput {
  name: string;
  description?: string;
  active?: boolean;
  deleted?: boolean;
}

export const groupValidate = (data: GroupInput): ValidationResult => {
  const schema = Joi.object({
    name: Joi.string().required().trim().label('Group Name'),
    description: Joi.string().optional().trim().label('Group Description'),
    active: Joi.boolean().optional().label('Active Status'),
    deleted: Joi.boolean().optional().label('Deleted Status'),
  });

  return schema.validate(data);
};
