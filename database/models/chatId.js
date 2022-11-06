const mongoose = require("mongoose");

const chatIdSchema  = new mongoose.Schema({
            content:{type:String,require:true},
            createdBy:{type:String,require:true},
            createdWith:{type:String,require:true},
            chatId:{type:String,require:true},
            created_at:
            { 
                type: Date,
                default: Date.now
             },


},

 )

 const chatIdModel = mongoose.model('ChatId', chatIdSchema);

 module.exports=chatIdModel
 