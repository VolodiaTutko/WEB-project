const express = require("express");
const path = require("path");
const app = express();
const fs = require("fs");
const https = require("https");
const bcrypt = require("bcrypt");
const session = require("express-session");
// const hbs = require("hbs");
const axios = require("axios");
// const { exec } = require("child_process");

// -------------------------------
const servers = [
  { port: 3600, weight: 1, status: "" },
  { port: 6200, weight: 0, status: "" },
];

app.use(
  session({
    secret: "2td7dbd7d5d$$$$gdj$$dgd352ddkhcgd77dhdbeb",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);

const options = {
  key: fs.readFileSync(path.join(__dirname, "../certificates/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "../certificates/cert.pem")),
};

const templatePath = path.join(__dirname, "../templates");
const publicPath = path.join(__dirname, "../public");

app.set("view engine", "hbs");
app.set("views", templatePath);
app.use(express.static(publicPath));

https.createServer(options, app).listen(443, () => {
  console.log("Https server  started at 443");
});

const LogInCollection = require("./mongodb");
const { Collection } = require("mongoose");

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get("/src/script.js", (req, res) => {
  res.setHeader("Content-Type", "text/javascript");
  res.sendFile(path.join(__dirname, "/script.js"));
});

app.get("/src/script-home.js", (req, res) => {
  res.setHeader("Content-Type", "text/javascript");
  res.sendFile(path.join(__dirname, "/script-home.js"));
});

app.get("/signup", (req, res) => {
  res.render("signup");
});
app.get("/", (req, res) => {
  res.render("login");
});

app.post("/signup", async (req, res) => {
  const data = {
    name: req.body.name,
    password: req.body.password,
  };

  const naming = data.name;
  req.session.naming = naming;

  const checking = await LogInCollection.findOne({ name: data.name });

  if (checking) {
    res.send("User already exists. Please login or try another username");
  } else {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    data.password = hashedPassword;

    const User = await LogInCollection.insertMany(data);
    res.status(201).render("home", {
      naming: req.body.name,
    });
    console.log(User);
  }
});

app.post("/login", async (req, res) => {
  try {
    const check = await LogInCollection.findOne({ name: req.body.name });

    if (!check) {
      res.send("user not found");
    }

    const isPasswordMatch = await bcrypt.compare(
      req.body.password,
      check.password
    );

    if (isPasswordMatch) {
      req.session.naming = req.body.name;
      res.status(201).render("home", { naming: req.body.name });
    } else {
      res.send("wrong password");
    }
  } catch {
    res.send("wrong details");
  }
});

//---------------------------------------------------------------------------------//
const multer = require("multer");
 const csv = require("csv-parser");
const storage = multer.memoryStorage();
const moment = require("moment");
const upload = multer({
  limits: { fileSize: 350 * 1024 * 1024 },
});
// const zlib = require("zlib");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(upload.single("csvFile"));


async function isValidTask(graph, username) {
  const validMatrixRegex = /^[0-9,]+(\n[0-9,]+)*$/;

  // Перевірка на валідність символів у матрицях
  if (!validMatrixRegex.test(graph)) {
    console.log("невалідні символи");
    return false;
  }

  const rows1 = graph[0];
  const cols1 = graph.map((row) => row[0]);

  // Перевірка на квадратність матриці (умова для матицці суміжності)

  if (rows1.length !== cols1.length) {
    console.log("різна кількість рядків");
    return false;
  }

  if (rows1.length > 600) {
    console.log("Мвксимальна можлива матриця - 600х600");
    return false;
  }

  const user = await LogInCollection.findOne({ name: username });
  const activeTaskCount = user.tasks.filter(
    (task) => task.status === "Active"
  ).length;
  if (activeTaskCount > 7) {
    console.log("Макисмальна кількість активних завдань - 8");
    return false;
  }
}

async function isServerActive(server) {
  try {
    const response = await axios.get(`http://localhost:${server.port}`);
    //використовую бібліотеку axios для відправлення запиту до сервера і перевірки його статусу.
    if (response.status === 200) {
      return "active";
    }
  } catch (error) {
    return false;
  }
}

async function checkServerStatus(servers_) {
  for (const server of servers_) {
    server.status = await isServerActive(server);
  }
  //console.log( servers);
}

async function RoundRobin(servers) {
  const activeServers = servers.filter((server) => server.status === "active");

  const h = activeServers.sort((a, b) => b.weight - a.weight);
  const server = activeServers[0];
  server.weight = 0;
  const weightServer = activeServers[1];
  weightServer.weight = 1;
  // console.log('servers', servers);
  if (server === undefined) {
    return "all server unactive";
  } else {
    return server.port;
  }
}

async function balancer(servers) {
  await checkServerStatus(servers);
  const p = await RoundRobin(servers);
  return p;
}

app.post("/upload", async (req, res) => {
  const startNode = parseInt(req.body.startVertex);
  const endNode = parseInt(req.body.endVertex);
  const username = req.session.naming;

  const csvFile = req.file;

  if (csvFile) {
    // const compressGraph =  await compressAsync(csvFile);

    const fileData = csvFile.buffer.toString("utf8");
    const lines = fileData.split("\n");
    const graph = lines.map((line) =>
      line
        .trim()
        .split(",")
        .map((value) => parseInt(value))
    );

    const isValid = await isValidTask(graph, username);
    console.log(isValid);
    if (
      startNode < 0 ||
      startNode >= graph.length ||
      endNode < 0 ||
      endNode >= graph.length ||
      isValid === false
    ) {
      return res.status(400).send("Невірні вхідні дані");
    }

    const taskRandomId = Math.floor(Math.random() * 1000000);
    var currentDate = new Date();

    const user = await LogInCollection.findOne({ name: username });

    if (!user) {
      return res.status(400).send("Користувача не знайдено");
    }

    const task = {
      taskID: taskRandomId,
      requestDateTime: currentDate,
      startV: startNode,
      endV: endNode,
      min_distance: 0,
      status: "Active",
      percents: 0,
    };

    if (!user.tasks) {
      user.tasks = [task];
    } else {
      user.tasks.push(task);
    }

    await user.save();

    const serverPort = await balancer(servers);
    console.log("server-port", serverPort, "taskId", task.taskID);
    const BigData = new FormData();

    await BigData.append("startNode", startNode);
    await BigData.append("endNode", endNode);
    await BigData.append("username", username);
    await BigData.append("taskID", task.taskID);
    await BigData.append("graphCSV", JSON.stringify(graph));
    const response = await fetch(
      `http://localhost:${serverPort}/CalculateDijkstra`,
      {
        method: "POST",
        body: BigData,
      }
    );

    res.status(200).render('home', { naming: username});
  } else {
    res
      .status(400)
      .send(
        "Файл не був відправлений або перевищено ліміт розміру файлу (350 МБ)."
      );
  }
});

app.get("/getTaskStatus", async (req, res) => {
  const username = req.session.naming;
  const user = await LogInCollection.findOne({ name: username });

  if (!user) {
    return res.status(400).send("Користувача не знайдено");
  }

  const sortedTasks = user.tasks.sort(
    (a, b) => b.requestDateTime - a.requestDateTime
  );

  const taskObjects = sortedTasks.map((task) => ({
    taskID: task.taskID,
    requestDateTime: formatDateTime(task.requestDateTime),
    startV: task.startV,
    endV: task.endV,
    min_distance: task.min_distance,
    percents: task.percents,
    status: task.status,
  }));

  const taskStatusHTML = taskObjects
    .map((task) => {
      let disabled = ""; 
      if (task.percents === 100) {
        disabled = "disabled";
      }
      let disabledDelete = "disabled"; 
      if (task.percents === 100) {
        disabledDelete = "";
      }

      return `
  <div class="general-task" id="task-${task.taskID}">
      <div class="task">
          <h3>Task ID: ${task.taskID}</h3>
          <p>${task.requestDateTime}</p>
          <p>Start: ${task.startV}</p>
          <p>End: ${task.endV}</p>
          <p>Min Distance: ${task.min_distance}</p>
      </div>
      <div class="container-progress">
          <progress id="execution" max="100" value="${task.percents}">${task.percents}%</progress>
          <div class="percent">${task.percents}%</div>
          <button ${disabled} class="btn-cancel" data-taskid="${task.taskID}">Cancel</button>
          <button ${disabledDelete} class="btn-delete" data-taskid="${task.taskID}">Delete</button>
          <span class="marker">${task.status}</span>
      </div>
  </div>`;
    })
    .join("");

  res.send(taskStatusHTML);
});

function formatDateTime(dateTime) {
  return moment(dateTime).format("HH:mm:ss DD.MM.YYYY");
}

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).send("Перевищено ліміт розміру файлу (335 МБ).");
    } else {
      res.status(400).send("Помилка завантаження файлу.");
    }
  }
});

app.post("/deleteTask/:taskId", async (req, res) => {
  const username = req.session.naming;
  const taskId = req.params.taskId;

  const user = await LogInCollection.findOne({ name: username });

  if (!user) {
    return res.status(400).send("Користувача не знайдено");
  }

  user.tasks = user.tasks.filter((task) => task.taskID !== parseInt(taskId));
  await user.save();

  res.status(200);
});

app.post("/cancelTask/:taskId", async (req, res) => {
  const username = req.session.naming;
  const taskId = req.params.taskId;

  const user = await LogInCollection.findOne({ name: username });

  if (!user) {
    return res.status(400).send("Користувача не знайдено");
  }

  const task = user.tasks.find((task) => task.taskID === parseInt(taskId));

  if (!task) {
    return res.status(400).send("Завдання не знайдено");
  }

  task.status = "Canceled";
  console.log(`task status = ${task.status}`);

  await user.save();

  res.status(200);
});
