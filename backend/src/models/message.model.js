import mongoose from "mongoose";


const messageSchema = new mongoose.Schema({
  chat:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Chat",
    required:[true,"chatId is required"],
    index: true,
  },
  content:{
    type:String,
    required:[true,"content is required"],
    trim: true,
  },

  role:{
    type:String,
    enum:{
      values: ['user', 'ai'],
      message: '{VALUE} is not valid. You can only choose: user or ai as a role.'
    },
    required:[true,"role is required"]
  },

  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],
  
},{timestamps:true})

messageSchema.index({ chat: 1, _id: -1 });

const messageModel = mongoose.model("Message", messageSchema);

export {messageModel}