const multer = require("multer");
// const csv = require("csv-parser");
const express = require("express");
const path = require("path");
const app = express();
const fs = require("fs");
const session = require("express-session");
// const hbs = require("hbs");
const storage = multer.memoryStorage();
// const moment = require("moment");
const upload = multer({
  limits: { fileSize: 350 * 1024 * 1024 },
});
const bodyParser = require('body-parser');
const zlib = require('zlib');
app.use(bodyParser.json());
const port = process.env.PORT;
app.use(upload.single("csvFile"));
app.use(express.urlencoded({ extended: true }));

const LogInCollection = require("./mongodb");
const { Collection } = require("mongoose");

app.use(express.json());



//----------------------------------------------//

const tasksQueue = [];

app.get('/', (req, res) => {
  res.send(`Listening port: ${port}`); 
 });

async function worker  ()
  {
    try {
      if (tasksQueue.length > 0){
        const { graph, startNode, endNode, username, taskID } = tasksQueue.pop();
        const distance = await dijkstra(graph, startNode, endNode, username, taskID);
       
      }
      
      setTimeout(worker, 1000);
    } catch (error) {
      console.error('Error worker function:', error);
      throw error;
    }
  };
  
  worker();

app.post('/CalculateDijkstra', async (req, res) => {

  const username = req.body.username;
  const startNode = parseInt(req.body.startNode);
  const endNode = parseInt(req.body.endNode);
  const graphJSON = req.body.graphCSV;
  const taskID = parseInt(req.body.taskID);


  const graph = JSON.parse(graphJSON);

  // const distance = await dijkstra(graph, startNode, endNode, username, taskID);

  tasksQueue.unshift({ graph, startNode, endNode, username, taskID });   

  console.log(`Task ${taskID} started, user: ${username}, startNode: ${startNode}, endNode: ${endNode}`);
  
  res.json({ status: "OK" });
});

async function dijkstra(graph, startNode, endNode, username, taskID) {
  const numNodes = graph.length;
  const distances = new Array(numNodes).fill(Infinity);
  distances[startNode] = 0;
  const visited = new Set();

  let prev_percent = 0;

  for (let i = 0; i < numNodes - 1; i++) {
    const user = await LogInCollection.findOne({ name: username });
    const task = user.tasks.find((task) => task.taskID === taskID);
    if (task.status === "Canceled") {
      console.log(`Task ${taskID} canceled`);
      break;
    }

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

    const percents = Math.floor((i / (numNodes - 1)) * 100);
    if (percents % 20 === 0 && percents !== prev_percent) {
      prev_percent = percents;

      task.percents = percents;
      await user.save();
      // console.log(`Task ${taskID}: ${percents}%`);
    }

    await new Promise((resolve) => setTimeout(resolve, 20));

    if (i === numNodes - 2) {
      task.percents = 100;
      task.status = "Done";
      task.min_distance = distances[endNode];
      await user.save();
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

app.listen(port, () => {
  console.log(`Сервер слухає на порті ${port}`);
});
