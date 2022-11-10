const express=require('express')
const app =express();
const userModel =require('./database/models/user')
const chatIdModel=require('./database/models/chatId')
const cookieParser = require('cookie-parser')
const corsModule=require('cors')
const db=require('./database/index');
const server=require('http').createServer(app)
const PORT=  process.env.PORT || 8000


const io = require("socket.io")(server, {
	cors: {
	  origin: "*",
	  credentials:true,   
	  methods: ["GET", "POST"]
	}
  });
db.init()  //for DB connection

const fileupload = require("express-fileupload");
app.use(fileupload());

app.use(corsModule())
// app.use(express.json())
app.use(express.text())
app.use(cookieParser());
app.use(express.json({limit: "300mb",extended:true}));
app.use(express.urlencoded({limit: "300mb",extended:true,parameterLimit: 1000000}));

//------Socket.io-----------------------------------------------
io.on('connection',async (socket) => {
	   
socket.on('create', function(room) {
    console.log("recievied room",room)
	if(!room)
	{  
        //   let temp="Temp_ID"
		// socket.join(temp);
		console.log("Rooms in socket",socket.rooms)
		socket.on('chat message', function(msg,sendBy) {
			console.log("msg recived")
			io.emit('message', msg,sendBy);
	    	});
			socket.on('chat image', function(img,sendBy) {
				console.log("img recived")
				io.emit('image', img,sendBy);
			// io.sockets.in(room).emit('message', msg);
		
		  });
		  return
	}
	else
	{
		socket.join(room);
		console.log("Rooms in socket",socket.rooms)
	
		socket.on('chat message', function(msg,sendBy) {
			console.log("msg recived",msg,sendBy)
			
			
			io.sockets.in(room).emit('message', msg,sendBy);
			
		  });
		  socket.on('chat image', function(img,sendBy) {
			console.log("img recived")
			io.sockets.in(room).emit('image', img,sendBy);
		});


	}
  });

  socket.on('disconnect',()=>{
	// ZLk2x_U_U58GbNHsAABf

	// io.sockets.in(ZLk2x_U_U58GbNHsAABf).leave(ZLk2x_U_U58GbNHsAABf)
	console.log("disconnected")
  })
})

//------------------------------------------------------
app.get("/",(req,res)=>{
	res.send("Server is UP")
})
// getting user
app.route('/user').get((req,res)=>{
    userModel.find( {} )
		.then(function(data)
    {
		res.json(data);
      
      if(data === null)
      {
		res.end("No data")
      } 
      
    }).catch(function(err)
    {
        res.json({msg:err});	
        console.log(err)
    })

}).post((req,res)=>{
	const response=req.body
	const username=response.username;
	const password=response.password;
	const repeatpass=response.repeatPass;

	if(!username)
	{
			res.json({ msg:"Please Enter Username"})
			return
	}
		if(!password)
	{
        res.json({ msg:"Please Enter Password"})
			
			return
	}
    if(!repeatpass)
	{
        res.json({ msg:"Please Enter Confirm Password"})
			
			return
	}

  if(username && (password ===repeatpass))
  {
					userModel.create(
						{
							username:username,
							password:password

						}
					)
					    .then((data)=>
					    {    
						 res.json({ msg:"Successfully registered"});
						})
						.catch((err)=>
						{
						if(err.code==11000)
						{
						   res.status(401).json({msg:"Username already exists"})
						   return
						}
						console.log(err)
						res.json({ msg:"User Already Exist!!"})
					})
	}
	else
	{
    res.json({ msg:"Enter a valid detail || Password mismatch"})
	}
})

app.route('/user/:id?').get((req,res)=>{
	const _id=req.params.id
    userModel.findOne( {_id} )
		.then(function(data)
    {
		console.log("By id")
		res.json(data);
      
      if(data === null)
      {
		res.end("No data")
		return
      } 
	  return
	  
      
    }).catch(function(err)
    {
        res.json({msg:err});	
        console.log(err)
    })

})


//---------------------------------------new Routes--------------------------
app.get('/chatWith/:user?',(req,res)=>{
	const user=req.params.user
	console.log("user",user)
	userModel.findOne({username:user})
	.then(data=>{
		// console.log(res)
         res.json(data)
		//  console.log(data)
		// for(let i of data.chat_with)
		// {
		// 	console.log(i)
		// }
		
	})
})

// content:{type:String,require:true},
// createdBy:{type:String,require:true},
// createdWith:{type:String,require:true},
// chatId:{type:String,require:true}

app.post('/message',async(req,res)=>{
	const response=req.body
	const content=response.msg
	console.log("msg",content)
	const createdBy=response.user2user.sender.username
	

	const sender_id=response.user2user.sender._id
	const reciever_id=response.user2user.reciever._id


	console.log("createdBy",createdBy)

	const createdWith=response.user2user.reciever.username


	console.log("createdWith",createdWith)

	const ids=`${createdBy}${createdWith}`
	const chatId=ids.split('').sort().join('');
	console.log("chatID",chatId)
	try {
		if(content.includes("https://you"||"https://www.youtube.com"))
		{
			await chatIdModel.create({
				link:content,
				createdBy,
				createdWith,
				chatId
			})
			return
		}
		await chatIdModel.create({
			content,
			createdBy,
			createdWith,
			chatId
		})
	userModel.findOne({_id:sender_id})
	.then(data=>{
		if(!data) return
		if(!(data.chat_with).length)
		{
			console.log("inside if")
			userModel.updateOne({_id:sender_id},
				{$push :{chat_with:{chatId,createdWith,reciever_id}}})
				.then(data=>{console.log("sender",data)})
		}
		else
		{
			const found=(data.chat_with).find(item=>{return item.chatId==chatId})
			// console.log("found",found,data.chat_with)
			//no need to create again
			if(!found)
			{
				console.log("new chatid created")
				userModel.updateOne({_id:sender_id},
					{$push :{chat_with:{chatId,createdWith,reciever_id}}})
					.then(data=>{return console.log("sender",data)})
			}
			console.log("no need to create again chatid")
			return
		}
	})

	userModel.findOne({_id:reciever_id})
	.then(data=>{
		if(!data) return
		if(!(data.chat_with).length)
		{
			console.log("inside if")
			userModel.updateOne({_id:reciever_id},
				{$push :{chat_with:{chatId,createdBy,sender_id}}})
				.then(data=>{return console.log("reciever",data)})
		}
		else
		{
		 const found=(data.chat_with).find(item=>{return item.chatId===chatId})
		 //no need to create again
		 if(!found)
		 {
			console.log("new chatid created")
			userModel.updateOne({_id:reciever_id},
				{$push :{chat_with:{chatId,createdBy,sender_id}}})
				.then(data=>{console.log("reciever",data)})
		 }
		 console.log("no need to create again chatid")
		}
	})
	

	} catch (err) {
		console.error(err);
	}

})

//for images
app.post('/image',async(req,res)=>{
	const response=req.body
	const image=response.img
	console.log("Inside image Route")
	const createdBy=response.user2user.sender.username
	

	const sender_id=response.user2user.sender._id
	const reciever_id=response.user2user.reciever._id


	console.log("createdBy",createdBy)

	const createdWith=response.user2user.reciever.username


	console.log("createdWith",createdWith)

	const ids=`${createdBy}${createdWith}`
	const chatId=ids.split('').sort().join('');
	console.log("chatID",chatId)
	try {
		await chatIdModel.create({
			image,
			createdBy,
			createdWith,
			chatId
		})
	userModel.findOne({_id:sender_id})
	.then(data=>{
		if(!data) return
		if(!(data.chat_with).length)  //if chat_with is empty then create
		{
			console.log("inside if")
			userModel.updateOne({_id:sender_id},
				{$push :{chat_with:{chatId,createdWith,reciever_id}}})
				.then(data=>{console.log("sender",data)})
		}
		else   // when chat_with have length then check chatid
		{
			const found=(data.chat_with).find(item=>{return item.chatId==chatId})
			// console.log("found",found,data.chat_with)
			//no need to create again
			if(!found)
			{
				console.log("new chatid created")
				userModel.updateOne({_id:sender_id},
					{$push :{chat_with:{chatId,createdWith,reciever_id}}})
					.then(data=>{return console.log("sender",data)})
			}
			console.log("no need to create again chatid")
			return
		}
	})

	userModel.findOne({_id:reciever_id})
	.then(data=>{
		if(!data) return
		if(!(data.chat_with).length)
		{
			console.log("inside if")
			userModel.updateOne({_id:reciever_id},
				{$push :{chat_with:{chatId,createdBy,sender_id}}})
				.then(data=>{return console.log("reciever",data)})
		}
		else
		{
		 const found=(data.chat_with).find(item=>{return item.chatId===chatId})
		 //no need to create again
		 if(!found)
		 {
			console.log("new chatid created")
			userModel.updateOne({_id:reciever_id},
				{$push :{chat_with:{chatId,createdBy,sender_id}}})
				.then(data=>{console.log("reciever",data)})
		 }
		 console.log("no need to create again chatid")
		}
	})
	

	} catch (err) {
		console.error(err);
	}

})

//for Video
app.post('/uploadvideo',async(req,res)=>{
	console.log(req.body);
	console.log(req.files)
	const sender=JSON.parse(req.body.sender)
	const reciever=JSON.parse(req.body.reciever)
    console.log(reciever)
	console.log(sender)
	try
	{
		var base64=await new Buffer.from(req.files.video.data).toString('base64');
		// console.log(base64)

		//---------------------------------
		const createdBy=sender.username
		const sender_id=sender._id
		const createdWith=reciever.username
		const reciever_id=reciever._id
		const ids=`${createdBy}${createdWith}`
	const chatId=ids.split('').sort().join('');
	console.log("chatID",chatId)
	try {
		await chatIdModel.create({
			video:base64,
			createdBy,
			createdWith,
			chatId
		})
	userModel.findOne({_id:sender_id})
	.then(data=>{
		if(!data) return
		if(!(data.chat_with).length)  //if chat_with is empty then create
		{
			console.log("inside if")
			userModel.updateOne({_id:sender_id},
				{$push :{chat_with:{chatId,createdWith,reciever_id}}})
				.then(data=>{console.log("sender",data)})
		}
		else   // when chat_with have length then check chatid
		{
			const found=(data.chat_with).find(item=>{return item.chatId==chatId})
			// console.log("found",found,data.chat_with)
			//no need to create again
			if(!found)
			{
				console.log("new chatid created")
				userModel.updateOne({_id:sender_id},
					{$push :{chat_with:{chatId,createdWith,reciever_id}}})
					.then(data=>{return console.log("sender",data)})
			}
			console.log("no need to create again chatid")
			return
		}
	})

	userModel.findOne({_id:reciever_id})
	.then(data=>{
		if(!data) return
		if(!(data.chat_with).length)
		{
			console.log("inside if")
			userModel.updateOne({_id:reciever_id},
				{$push :{chat_with:{chatId,createdBy,sender_id}}})
				.then(data=>{return console.log("reciever",data)})
		}
		else
		{
		 const found=(data.chat_with).find(item=>{return item.chatId===chatId})
		 //no need to create again
		 if(!found)
		 {
			console.log("new chatid created")
			userModel.updateOne({_id:reciever_id},
				{$push :{chat_with:{chatId,createdBy,sender_id}}})
				.then(data=>{console.log("reciever",data)})
		 }
		 console.log("no need to create again chatid")
		}
	})
	

	} catch (err) {
		console.error(err);
	}
		//---------------------------------
	}
	catch{(err=>console.log(err))}
	// console.log("base64",base64)
	
})




app.get('/getMessages/:chatId?',(req,res)=>{
    const chatId=req.params.chatId;
	console.log("chatid is", chatId)

	chatIdModel.find({chatId})
	.then(data=>{
		res.json(data)
	})
})


server.listen(PORT,()=>{
    console.log("Listening on",PORT)
})

