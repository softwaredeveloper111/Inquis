import mongoose from "mongoose";


const chatSchema = new mongoose.Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:[true,"userId must be required"],
    index:true,
  },

  title:{
    type:String,
    trim:true,
    maxlength:[60, "chat title must not exceed 60 characters"],
    required: [true, "chat title is required"],
  },
  
  isPinned:{
    type:Boolean,
    default:false,
  }


},{timestamps:true});

chatSchema.index({ user: 1, isPinned: 1, updatedAt: -1 });


const chatModel = mongoose.model("Chat", chatSchema);

export {chatModel}