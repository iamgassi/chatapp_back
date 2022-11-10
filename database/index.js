module.exports.init=function()
{
  const mongoose = require('mongoose');
   mongoose.connect('mongodb://localhost:27017/Testing')
  //  mongoose.connect('mongodb+srv://root:root12345@cluster0.rib2c.mongodb.net/chatapp?retryWrites=true&w=majority')


.then(function()            
{
  console.log("mongoCompass is connected ")
})
.catch(function(err)
{
  console.log(err+"error ocuured")
})
}
