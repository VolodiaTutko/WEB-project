const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/WebProjectDatabase")
  .then(() => {
    console.log('mongoose connected');
  })
  .catch((e) => {
    console.log('failed');
  });

const taskSchema = new mongoose.Schema({
  taskID: {
    type: Number,
    required: true
  },
  requestDateTime: {
    type: Date,
    required: true
  },
  graph: [[Number]],
  startV: {
    type: Number,
    required: true
  },
  endV: {
    type: Number,
    required: true
  },
  min_distance: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["Done", "Active", "Canceled"],
    required: true
  },
  percents: {
    type: Number,
    required: true
  }
});

const logInSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  tasks: [taskSchema]
});

const LogInCollection = mongoose.model('users_collection', logInSchema);

module.exports = LogInCollection;
