module.exports.init=function()
{
  const mongoose = require('mongoose');
   mongoose.connect('mongodb://localhost:27017/materialUI_copy')

.then(function()            
{
  console.log("mongoCompass is connected ")
})
.catch(function(err)
{
  console.log(err+"error ocuured")
})
}
