import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');
import * as fs from 'fs';

let taskPath = path.join(__dirname, '..', 'index.js');
let tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);
let reportFilePath = path.join(__dirname, 'report.json');
let reportContent = fs.readFileSync(reportFilePath, 'utf8');

tmr.setInput('bicepWhatIfJSON', reportContent);

tmr.run();