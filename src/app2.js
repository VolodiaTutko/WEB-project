const express = require('express');
const app = express();
const PORT = 3002;
const fs = require('fs');
const path = require("path");


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


const graph = [
  [0, 1, 4, 0],
  [1, 0, 2, 5],
  [4, 2, 0, 1],
  [0, 5, 1, 0],
];


const startNode = 0;
const endNode = 3;

app.get('/app2', (req, res) => {
  // const startNode = parseInt(req.query.startNode);
  // const endNode = parseInt(req.query.endNode);
  const shortestDistance = dijkstra(graph, startNode, endNode);
  res.json({ distance: shortestDistance });
});

app.listen(PORT, () => {
  console.log(`Сервер працює на порту ${PORT}`);
});
