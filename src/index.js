const express = require("express");
const path = require("path");
const app = express();
const fs = require("fs");
const https = require("https");
const bcrypt = require("bcrypt");
const session = require('express-session');
const hbs = require('hbs');
// -------------------------------


app.use(session({
  secret: '2td7dbd7d5d$$$$gdj$$dgd352ddkhcgd77dhdbeb',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true } 
}));

const options = {
    key: fs.readFileSync(path.join(__dirname, "../certificates/key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "../certificates/cert.pem")),
};


const templatePath = path.join(__dirname, '../templates')
const publicPath = path.join(__dirname, '../public')





app.set('view engine', 'hbs')
app.set('views', templatePath)
app.use(express.static(publicPath))

https.createServer(options, app).listen(443, () => {
    console.log("Https server  started at 443");
});



const LogInCollection = require("./mongodb");
const { Collection } = require("mongoose");


app.use(express.json())

app.use(express.urlencoded({ extended: false }))









app.get('/src/script.js', (req, res) => {
    res.setHeader('Content-Type', 'text/javascript');
    res.sendFile(path.join(__dirname, '/script.js'));
});

app.get('/src/script-home.js', (req, res) => {
    res.setHeader('Content-Type', 'text/javascript');
    res.sendFile(path.join(__dirname, '/script-home.js'));
});

app.get('/signup', (req, res) => {
    res.render('signup')
})
app.get('/', (req, res) => {
    res.render('login')
})








app.post('/signup', async (req, res) => {
    
    const data = {
        name: req.body.name,
        password: req.body.password
    } 

    const naming = data.name; 
    req.session.naming = naming; 
    
    const checking = await LogInCollection.findOne({ name: data.name })

    if(checking)  {
        res.send("User already exists. Please login or try another username")
    }
    else {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        data.password = hashedPassword;


        const User = await LogInCollection.insertMany(data);
        res.status(201).render("home", {
                         naming: req.body.name
                     });
        console.log(User);

    }

  
});




app.post('/login', async (req, res) => {

    try {
        const check = await LogInCollection.findOne({ name: req.body.name })

        if (!check) {
            res.send("user not found")
        }

        const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);

       if(isPasswordMatch) {
        req.session.naming = req.body.name;
        res.status(201).render("home", { naming: req.body.name  } );
       }
       else{
         res.send("wrong password");
       }
    } catch{
              res.send("wrong details");
       }


    });

//---------------------------------------------------------------------------------//
const multer = require('multer');
const csv = require('csv-parser');
const storage = multer.memoryStorage();
const moment = require('moment');
const upload = multer({ 
  limits: { fileSize: 350 * 1024 * 1024 } 
});

app.use(upload.single('csvFile'));

function dijkstra(graph, startNode, endNode) {
    const numNodes = graph.length;
    const distances = new Array(numNodes).fill(Infinity);
    distances[startNode] = 0;
    const visited = new Set();
  
    for (let i = 0; i < numNodes - 1; i++) {
      const closestNode = getClosestNode(distances, visited);
      visited.add(closestNode);
  
      for (let j = 0; j < numNodes; j++) {
        if (!visited.has(j) && graph[closestNode][j] !== 0) {
          const distance = distances[closestNode] + graph[closestNode][j];
          if (distance < distances[j]) {
            distances[j] = distance;
          }
        }
      }
    }
  
    for (let i = 0; i < numNodes; i++) {
      if (distances[i] === 0) {
        distances[i] = Infinity;
      }
    }
  
    return distances[endNode];
  }
  
  function getClosestNode(distances, visited) {
    let minDistance = Infinity;
    let closestNode = null;
    for (let i = 0; i < distances.length; i++) {
      if (!visited.has(i) && distances[i] < minDistance) {
        minDistance = distances[i];
        closestNode = i;
      }
    }
    return closestNode;
  }
  app.post('/upload', async (req, res) => {
    const csvFile = req.file;
    

    if (csvFile) {
        const fileData = csvFile.buffer.toString('utf8');
        const lines = fileData.split('\n');

        const graph = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const values = line.split(',');
            const row = values.map(value => parseInt(value));
            graph.push(row);
        }

        const startNode = parseInt(req.body.startVertex);
        const endNode = parseInt(req.body.endVertex);
          if (startNode < 0 || startNode >= graph.length || endNode < 0 || endNode >= graph.length) {
          return res.status(400).send('Недійсні значення startNode або endNode.');
    }
        const startTime = new Date();
        const distance = dijkstra(graph, startNode, endNode);
        const endTime = new Date();


        const executionTime = endTime - startTime; 
        console.log(`Execution time: ${executionTime} ms`);
        const username = req.session.naming;       
        
        const user = await LogInCollection.findOne({ name: username });

        if (!user) {
            return res.status(400).send('Користувача не знайдено');
        }

        const taskRandomId = Math.floor(Math.random() * 1000000);
        var currentDate = new Date();
     
     
        const task = {
            taskID: taskRandomId, 
            requestDateTime: currentDate,
            startV: startNode,
            endV: endNode,
            min_distance: distance,
            status: 'Active',
            percents: 0
        };

        
        if (!user.tasks) {
            user.tasks = [task];
        } else {
            user.tasks.push(task);
        }

        
        await user.save();
        //const activeTasks = await LogInCollection.find({ status: 'Active' });
        //console.log(user.tasks);
          res.render('home', { naming: username, tasks: user.tasks });
    } else {
        res.status(400).send('Файл не був відправлений або перевищено ліміт розміру файлу (350 МБ).');
    }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).send('Перевищено ліміт розміру файлу (335 МБ).');
      } else {
          res.status(400).send('Помилка завантаження файлу.');
      }
  }
});

hbs.registerHelper('formatDateTime', (dateTime) => {
  return moment(dateTime).format('HH:mm:ss DD.MM.YYYY');
});
