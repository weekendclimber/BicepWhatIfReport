import * as path from 'path';
import * as assert from 'assert';
import * as ttm from 'azure-pipelines-task-lib/mock-test';

describe('BicepWhatIfReport Task Suite', function () {
    before( function() {
        // Setup code can go here if needed
    });

    after( function() {
        // Teardown code can go here if needed
    });

    it('should run successfully with valid JSON input', async function (done: Mocha.Done) {
        // Add successful test case
        // 1 minute timeout for the test suite
        this.timeout(1000 * 60);

        let tp: string = path.join(__dirname, 'success.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        tr.runAsync().then(() => {
            console.log(`Test completed successfully: ${tr.succeeded}`);
            assert.equal(tr.succeeded, true, 'task should have succeeded');
            assert.equal(tr.warningIssues.length, 0, 'task should not have any warnings');
            assert.equal(tr.errorIssues.length, 0, 'tash should not have any errors');
            console.log(tr.stdout);
            assert.equal(tr.stdout.indexOf('') >= 0, true, 'should have printed the expected output');
            done();
        }).catch((err: any) => {
            done(`Test failed with error: ${err}`);
        });
    });

    it('should fail with invalid JSON input', async function(done: Mocha.Done) {
        // Add failure test case
    });
});