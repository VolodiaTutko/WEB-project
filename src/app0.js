const express = require('express');
const app = express();
const PORT = 3000;
const fs = require('fs');
const path = require("path");
const formidable = require('formidable');
const csv = require('csv-parser');

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

app.post('/upload', (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Помилка завантаження файлу:', err);
      res.status(500).json({ error: 'Помилка завантаження файлу' });
      return;
    }

    const csvFile = files.csvFile; // Отримуємо завантажений файл
    const startNode = parseInt(fields.startNode);
    const endNode = parseInt(fields.endNode);

    const graph = []; // Масив для матриці суміжності

    fs.createReadStream(csvFile.path)
      .pipe(csv())
      .on('data', (row) => {
        // Додаємо рядок з CSV файлу до матриці
        const rowValues = Object.values(row).map(Number);
        graph.push(rowValues);
      })
      .on('end', () => {
        const shortestDistance = dijkstra(graph, startNode, endNode);
        res.json({ distance: shortestDistance });
      });
  });
});

app.listen(PORT, () => {
  console.log(`Сервер працює на порту ${PORT}`);
});
