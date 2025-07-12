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
exports.parseWhatIfJson = parseWhatIfJson;
/**
 * Parses Bicep what-if JSON output and returns a structured object.
 * @param file - The absolute file path to the raw JSON file from the Bicep what-if command.
 * @returns Parsed representation of the what-if changes as object.
 */
// File and path imports
const fs = __importStar(require("fs"));
// Entry point for Azure DevOps Extension
const tl = require("azure-pipelines-task-lib/task");
async function parseWhatIfJson(file) {
    // TODO: Implement robust parsing logic for Bicep what-if output
    let parsed;
    try {
        tl.debug(`Trying to parse what-if JSON file: ${file}`);
        if (!fs.existsSync(file)) {
            tl.debug(`The file does not exist: ${file}`);
            tl.setResult(tl.TaskResult.Failed, `The file does not exist: ${file}`);
            throw new Error(`The file does not exist: ${file}`);
        }
        else {
            tl.debug(`Reading what-if JSON file: ${file}`);
            let fileContent = await fs.promises.readFile(file, 'utf8');
            parsed = JSON.parse(fileContent);
            return parsed;
        }
    }
    catch (err) {
        if (err instanceof Error) {
            throw new Error(`Failed to parse what-if JSON: ${err.message}`);
        }
        else {
            throw new Error(`Failed to parse what-if JSON: ${err}`);
        }
    }
}
