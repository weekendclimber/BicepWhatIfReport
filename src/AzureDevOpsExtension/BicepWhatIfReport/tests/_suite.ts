import * as path from 'path';
import * as fs from 'fs';
import * as assert from 'assert';
import * as ttm from 'azure-pipelines-task-lib/mock-test';

describe('BicepWhatIfReport Task Suite', function () {
    let testResult: string; // = undefined;
    let testResultContent: string; // = undefined;

    before( function() {
        // Setup code can go here if needed
        testResult = path.join(__dirname, 'results.txt');
        if (fs.existsSync(testResult)) {
            testResultContent = fs.readFileSync(testResult, 'utf8');
        } else {
            throw new Error(`Test JSON file not found at path: ${testResult}`);
        };
    });

    after( function() {
        // Teardown code can go here if needed
    });

    it('should run successfully with valid JSON input', function (done: Mocha.Done) {
        // 1 minute timeout for the test suite
        this.timeout(1000 * 60);

        let tp: string = path.join(__dirname, 'success.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.runAsync().then(() => {
            console.log(`Test completed successfully: ${tr.succeeded}`);
            assert.equal(tr.succeeded, true, 'task should have succeeded');
            assert.equal(tr.warningIssues.length, 0, 'task should not have any warnings');
            assert.equal(tr.errorIssues.length, 0, 'task should not have any errors');
            //console.log(tr.stdout);
            assert.equal(tr.stdout.indexOf(testResultContent) >= 0, true, 'should have printed the expected output');
            done();
        }).catch((err: any) => {
            done(`Test failed with error: ${err}`);
        });
    });

    it('should fail with invalid JSON input and return 1', function(done: Mocha.Done) {
        // 1 minute timeout for the test suite
        this.timeout(1000 * 60);

        let tp: string = path.join(__dirname, 'failure.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.runAsync().then(() => {
            console.log(`Test completed successfully: ${tr.succeeded}`);
            assert.equal(tr.succeeded, false, 'task should have failed');
            assert.equal(tr.warningIssues.length, 0, 'task should not have any warnings');
            assert.equal(tr.errorIssues.length, 1, 'task should have one error');
            console.log(`Error issues: ${tr.errorIssues[0]}`)
            assert.equal(tr.errorIssues[0], 'Bad input was given','should have printed the expected error message');
            assert.equal(tr.stdout.indexOf(testResultContent), -1, 'should not have printed the expected output');
            done();
        }) //.catch((err: any) => {
            //done(`Test failed with error: ${err}`);
        //});
    });
});