"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// Entry point for Azure DevOps Extension
//import tl = require('azure-pipelines-task-lib/task');
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
//import md = require('azure-devops-ui/Markdown');
const parseWhatIfJson_1 = require("./services/parseWhatIfJson");
const generateReport_1 = require("./reports/generateReport");
async function main() {
    try {
        const inputFilePath = path.resolve(__dirname, '../../../tests/AzureDevOpsExtension/report.json');
        const outputFilePath = path.resolve(__dirname, 'test.md');
        const inputString = fs.readFileSync(inputFilePath, 'utf8');
        //const inputString: string | undefined = tl.getInput('bicepWhatIfJSON', true);
        //if (inputString == 'bad') {
        //  tl.setResult(tl.TaskResult.Failed, 'Bad input was given');
        //  return;
        //}
        //console.log('Hello', inputString);
        // Parse the what-if JSON
        const parsed = (0, parseWhatIfJson_1.parseWhatIfJson)(inputString);
        console.log('Parsed what-if JSON:', parsed);
        // Generate a human-readable report
        const report = (0, generateReport_1.generateReport)(parsed);
        //const report = generateReport(inputString as string);
        console.log('Generated report:', report);
        fs.writeFileSync(outputFilePath, await report, 'utf-8');
    }
    catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
        //tl.setResult(tl.TaskResult.Failed, err.message);
    }
}
main().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});
