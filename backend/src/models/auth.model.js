import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/config.js';


const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      lowercase: true,
      trim: true,
      required: [true, 'username must be required'],
      unique: [true, 'username already used'],
      minlength: [3, 'username must be at least 3 characters'],
      maxlength: [30, 'username cannot exceed 30 characters'],
      match: [/^[a-z0-9_]{3,30}$/, 'please provide a valid username'],
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, 'email must be required'],
      unique: [true, 'email already used'],
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },

    password: {
      type: String,
      required: [true, 'password must be required'],
      minlength: [8, 'password must be at least 8 characters'],
      maxlength: [72, 'password cannot exceed 72 characters'],
      match: [
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,72}$/,
        'please provide a valid password',
      ],
      select: false,
    },

    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);



/** hashing password before save user in database */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, config.BCRYPT_GEN_SALT);
});





/** custom mongoose method for compare user's password */
userSchema.methods.comparePassword = async function (userPassword) {
  return await bcrypt.compare(userPassword ,this.password );
};




/** custom mongoose method for remove password and __v in the response */
userSchema.methods.toJSON = function () {
  const userObj = this.toObject();
  delete userObj.password;
  delete userObj.__v;
  return userObj;
};





export const userModel = mongoose.model('User', userSchema);
