"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//import ma = require('azure-pipelines-task-lib/mock-answer');
const tmrm = require("azure-pipelines-task-lib/mock-run");
const path = require("path");
let taskPath = path.join(__dirname, '..', 'index.js');
let tmr = new tmrm.TaskMockRunner(taskPath);
tmr.setInput('bicepWhatIfJSON', 'bad'); // Simulate bad input
tmr.run();
