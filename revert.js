const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

let users = [
    {id : 1,name : "lalith"},
    {id : 2,name : "sai"}
];


app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next(); // Pass control to next middleware/handler
});

function validateUser(req, res, next) {
  const { id, name } = req.body;
  if (id!=3 || name != "lalith") {
    return res.status(400).json({ error: "Invalid user data" });
  }
  next(); 
}

app.use(validateUser); // global middle ware no need to write in routes like verifyUser

function verifyUser(req,res,next) {
    const {id,name} = req.body;
    if(typeof id!="number"||typeof name!="string") {
     return res.status(400).json({ error: "user data is not in format" });   
    }
}


app.get("/users",verifyUser,(req,res)=>{
    res.json(users);
}); 

app.post("/users",verifyUser,(req,res)=>{
    const newUser = req.body;
    users.push(newUser);
    res.status(201).json({message:"User-created",user : newUser});
});

app.put("/users/:id",(req,res)=>{
    const id = parseInt(req.params.id);
    users = users.map(user => user.id === id ? req.body : user);
    res.json({message : `User ${id} updated`,user:req.body});
});

app.delete("/users/:id",(req,res)=>{

    const id = parseInt(req.params.id);
    users = users.filter(user=>user.id!==id);
    res.json({message : `User${id} deleted`});
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


// what are middlewares

