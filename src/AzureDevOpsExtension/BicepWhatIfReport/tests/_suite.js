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
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const assert = __importStar(require("assert"));
const ttm = __importStar(require("azure-pipelines-task-lib/mock-test"));
describe('BicepWhatIfReport Task Suite', function () {
    let testResult; // = undefined;
    let testResultContent; // = undefined;
    before(function () {
        // Setup code can go here if needed
        testResult = path.join(__dirname, 'results.txt');
        if (fs.existsSync(testResult)) {
            testResultContent = fs.readFileSync(testResult, 'utf8');
        }
        else {
            throw new Error(`Test JSON file not found at path: ${testResult}`);
        }
        ;
    });
    after(function () {
        // Teardown code can go here if needed
    });
    it('should run successfully with valid JSON input', function (done) {
        // 1 minute timeout for the test suite
        this.timeout(1000 * 60);
        let tp = path.join(__dirname, 'success.js');
        let tr = new ttm.MockTestRunner(tp);
        tr.runAsync().then(() => {
            console.log(`Test completed successfully: ${tr.succeeded}`);
            assert.equal(tr.succeeded, true, 'task should have succeeded');
            assert.equal(tr.warningIssues.length, 0, 'task should not have any warnings');
            assert.equal(tr.errorIssues.length, 0, 'task should not have any errors');
            //console.log(tr.stdout);
            assert.equal(tr.stdout.indexOf(testResultContent) >= 0, true, 'should have printed the expected output');
            done();
        }).catch((err) => {
            done(`Test failed with error: ${err}`);
        });
    });
    it('should fail with invalid JSON input and return 1', function (done) {
        // 1 minute timeout for the test suite
        this.timeout(1000 * 60);
        let tp = path.join(__dirname, 'failure.js');
        let tr = new ttm.MockTestRunner(tp);
        tr.runAsync().then(() => {
            console.log(`Test completed successfully: ${tr.succeeded}`);
            assert.equal(tr.succeeded, false, 'task should have failed');
            assert.equal(tr.warningIssues.length, 0, 'task should not have any warnings');
            console.log(`Error count: ${tr.errorIssues.length}`);
            assert.equal(tr.errorIssues.length, 1, 'task should have one error');
            console.log(`Error issue 1: ${tr.errorIssues[0]}`);
            //console.log(`Error issue 2: ${tr.errorIssues[0]}`)
            assert.equal(tr.errorIssues[0], 'Failed to parse what-if JSON: Unexpected token \'b\', "bad" is not valid JSON', 'should have printed the expected error message');
            //assert.equal(tr.errorIssues[1], 'No JSON input was given!','should have printed the expected error message');
            assert.equal(tr.stdout.indexOf(testResultContent), -1, 'should not have printed the expected output');
            done();
        }).catch((err) => {
            done(`Test failed with error: ${err}`);
        });
    });
});
