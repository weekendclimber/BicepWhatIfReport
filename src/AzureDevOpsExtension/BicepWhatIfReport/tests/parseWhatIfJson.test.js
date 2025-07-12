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
const chai_1 = require("chai");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const parseWhatIfJson_1 = require("../services/parseWhatIfJson");
// Mock Azure DevOps task library for testing
const mockTl = {
    debug: (message) => console.log(`DEBUG: ${message}`),
    setResult: (result, message) => console.log(`RESULT: ${result} - ${message}`),
    TaskResult: {
        Failed: 'Failed',
        Succeeded: 'Succeeded'
    }
};
// Replace the module require with our mock
const tl = require("azure-pipelines-task-lib/task");
Object.assign(tl, mockTl);
describe('parseWhatIfJson', () => {
    const testDataDir = path.join(__dirname, 'test-data');
    describe('Valid JSON parsing', () => {
        it('should parse minimal valid JSON successfully', async () => {
            const filePath = path.join(testDataDir, 'minimal-valid.json');
            const result = await (0, parseWhatIfJson_1.parseWhatIfJson)(filePath);
            (0, chai_1.expect)(result).to.be.an('object');
            (0, chai_1.expect)(result).to.have.property('changes');
            (0, chai_1.expect)(result.changes).to.be.an('array');
            (0, chai_1.expect)(result.changes).to.have.lengthOf(1);
            (0, chai_1.expect)(result.changes[0]).to.have.property('changeType', 'Create');
        });
        it('should parse all change types correctly', async () => {
            const filePath = path.join(testDataDir, 'all-change-types.json');
            const result = await (0, parseWhatIfJson_1.parseWhatIfJson)(filePath);
            (0, chai_1.expect)(result).to.be.an('object');
            (0, chai_1.expect)(result).to.have.property('changes');
            const changes = result.changes;
            (0, chai_1.expect)(changes).to.be.an('array');
            (0, chai_1.expect)(changes).to.have.lengthOf(6);
            // Verify all change types are present
            const changeTypes = changes.map((change) => change.changeType);
            (0, chai_1.expect)(changeTypes).to.include.members(['Create', 'Modify', 'Delete', 'NoChange', 'Ignore', 'Unsupported']);
        });
        it('should parse empty deployment JSON', async () => {
            const filePath = path.join(testDataDir, 'empty-deployment.json');
            const result = await (0, parseWhatIfJson_1.parseWhatIfJson)(filePath);
            (0, chai_1.expect)(result).to.be.an('object');
            (0, chai_1.expect)(result).to.have.property('changes');
            (0, chai_1.expect)(result.changes).to.be.an('array');
            (0, chai_1.expect)(result.changes).to.have.lengthOf(0);
        });
        it('should parse complex nested JSON structures', async () => {
            const filePath = path.join(testDataDir, 'complex-nested.json');
            const result = await (0, parseWhatIfJson_1.parseWhatIfJson)(filePath);
            (0, chai_1.expect)(result).to.be.an('object');
            (0, chai_1.expect)(result).to.have.property('changes');
            const changes = result.changes;
            (0, chai_1.expect)(changes).to.be.an('array');
            (0, chai_1.expect)(changes).to.have.lengthOf(1);
            const change = changes[0];
            (0, chai_1.expect)(change).to.have.property('after');
            (0, chai_1.expect)(change.after).to.have.property('properties');
            (0, chai_1.expect)(change.after.properties).to.have.property('encryption');
            (0, chai_1.expect)(change.after.properties).to.have.property('networkAcls');
            (0, chai_1.expect)(change.after.properties).to.have.property('tags');
        });
        it('should parse JSON with Unicode characters', async () => {
            const filePath = path.join(testDataDir, 'unicode-content.json');
            const result = await (0, parseWhatIfJson_1.parseWhatIfJson)(filePath);
            (0, chai_1.expect)(result).to.be.an('object');
            (0, chai_1.expect)(result).to.have.property('changes');
            const changes = result.changes;
            (0, chai_1.expect)(changes).to.be.an('array');
            (0, chai_1.expect)(changes).to.have.lengthOf(1);
            const tags = changes[0].after.tags;
            (0, chai_1.expect)(tags.Description).to.include('测试存储账户');
            (0, chai_1.expect)(tags.Description).to.include('🚀');
            (0, chai_1.expect)(tags.Project).to.equal('Διεθνές έργο');
            (0, chai_1.expect)(tags.Unicode).to.equal('こんにちは世界');
        });
        it('should parse JSON with errors structure', async () => {
            const filePath = path.join(testDataDir, 'with-errors.json');
            const result = await (0, parseWhatIfJson_1.parseWhatIfJson)(filePath);
            (0, chai_1.expect)(result).to.be.an('object');
            (0, chai_1.expect)(result).to.have.property('error');
            (0, chai_1.expect)(result.error).to.have.property('code', 'DeploymentValidationFailed');
            (0, chai_1.expect)(result.error).to.have.property('details');
            (0, chai_1.expect)(result.error.details).to.be.an('array');
        });
    });
    describe('Error handling', () => {
        it('should throw error for non-existent file', async () => {
            const filePath = path.join(testDataDir, 'non-existent-file.json');
            try {
                await (0, parseWhatIfJson_1.parseWhatIfJson)(filePath);
                chai_1.expect.fail('Should have thrown an error');
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.an('error');
                (0, chai_1.expect)(error.message).to.include('The file does not exist');
            }
        });
        it('should throw error for empty file', async () => {
            const filePath = path.join(testDataDir, 'empty-file.json');
            try {
                await (0, parseWhatIfJson_1.parseWhatIfJson)(filePath);
                chai_1.expect.fail('Should have thrown an error');
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.an('error');
                (0, chai_1.expect)(error.message).to.include('Failed to parse what-if JSON');
            }
        });
        it('should throw error for malformed JSON', async () => {
            const filePath = path.join(testDataDir, 'malformed-syntax.json');
            try {
                await (0, parseWhatIfJson_1.parseWhatIfJson)(filePath);
                chai_1.expect.fail('Should have thrown an error');
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.an('error');
                (0, chai_1.expect)(error.message).to.include('Failed to parse what-if JSON');
            }
        });
        it('should handle file permission errors gracefully', async () => {
            // Create a temporary file with no read permissions
            const tempFilePath = path.join(testDataDir, 'no-permission.json');
            fs.writeFileSync(tempFilePath, '{"test": "data"}');
            fs.chmodSync(tempFilePath, 0o000);
            try {
                await (0, parseWhatIfJson_1.parseWhatIfJson)(tempFilePath);
                chai_1.expect.fail('Should have thrown an error');
            }
            catch (error) {
                (0, chai_1.expect)(error).to.be.an('error');
                (0, chai_1.expect)(error.message).to.include('Failed to parse what-if JSON');
            }
            finally {
                // Clean up - restore permissions and delete file
                try {
                    fs.chmodSync(tempFilePath, 0o644);
                    fs.unlinkSync(tempFilePath);
                }
                catch (cleanupError) {
                    // Ignore cleanup errors in test
                }
            }
        });
        it('should handle invalid file paths', async () => {
            const invalidPaths = [
                '',
                '   ',
                '/invalid/path/to/file.json',
                'relative/path.json'
            ];
            for (const invalidPath of invalidPaths) {
                try {
                    await (0, parseWhatIfJson_1.parseWhatIfJson)(invalidPath);
                    chai_1.expect.fail(`Should have thrown an error for path: ${invalidPath}`);
                }
                catch (error) {
                    (0, chai_1.expect)(error).to.be.an('error');
                    (0, chai_1.expect)(error.message).to.include('The file does not exist');
                }
            }
        });
    });
    describe('Edge cases', () => {
        it('should handle very large JSON files', async function () {
            this.timeout(10000); // Increase timeout for large file test
            // Create a large JSON file with many changes
            const largeJsonPath = path.join(testDataDir, 'large-file.json');
            const largeData = {
                changes: Array.from({ length: 1000 }, (_, i) => ({
                    changeType: 'Create',
                    resourceId: `/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/storage${i}`,
                    before: null,
                    after: {
                        apiVersion: '2023-01-01',
                        type: 'Microsoft.Storage/storageAccounts',
                        name: `storage${i}`,
                        location: 'eastus',
                        properties: {
                            accountType: 'Standard_LRS'
                        }
                    }
                }))
            };
            fs.writeFileSync(largeJsonPath, JSON.stringify(largeData));
            try {
                const result = await (0, parseWhatIfJson_1.parseWhatIfJson)(largeJsonPath);
                (0, chai_1.expect)(result).to.be.an('object');
                (0, chai_1.expect)(result).to.have.property('changes');
                (0, chai_1.expect)(result.changes).to.have.lengthOf(1000);
            }
            finally {
                // Clean up
                if (fs.existsSync(largeJsonPath)) {
                    fs.unlinkSync(largeJsonPath);
                }
            }
        });
        it('should handle deeply nested JSON structures', async () => {
            // Create a deeply nested JSON structure
            const deepNestedPath = path.join(testDataDir, 'deep-nested.json');
            let deepObject = {};
            let current = deepObject;
            // Create 50 levels of nesting
            for (let i = 0; i < 50; i++) {
                current.level = i;
                current.next = {};
                current = current.next;
            }
            current.final = 'value';
            const deepData = {
                changes: [{
                        changeType: 'Create',
                        resourceId: '/test/resource',
                        before: null,
                        after: {
                            deepProperty: deepObject
                        }
                    }]
            };
            fs.writeFileSync(deepNestedPath, JSON.stringify(deepData));
            try {
                const result = await (0, parseWhatIfJson_1.parseWhatIfJson)(deepNestedPath);
                (0, chai_1.expect)(result).to.be.an('object');
                (0, chai_1.expect)(result).to.have.property('changes');
                (0, chai_1.expect)(result.changes).to.have.lengthOf(1);
            }
            finally {
                // Clean up
                if (fs.existsSync(deepNestedPath)) {
                    fs.unlinkSync(deepNestedPath);
                }
            }
        });
        it('should handle JSON with null and undefined values', async () => {
            const nullValuesPath = path.join(testDataDir, 'null-values.json');
            const nullData = {
                changes: [{
                        changeType: 'Delete',
                        resourceId: '/test/resource',
                        before: {
                            name: 'test',
                            value: null,
                            empty: undefined
                        },
                        after: null
                    }]
            };
            fs.writeFileSync(nullValuesPath, JSON.stringify(nullData));
            try {
                const result = await (0, parseWhatIfJson_1.parseWhatIfJson)(nullValuesPath);
                (0, chai_1.expect)(result).to.be.an('object');
                (0, chai_1.expect)(result).to.have.property('changes');
                (0, chai_1.expect)(result.changes).to.have.lengthOf(1);
                (0, chai_1.expect)(result.changes[0].after).to.be.null;
            }
            finally {
                // Clean up
                if (fs.existsSync(nullValuesPath)) {
                    fs.unlinkSync(nullValuesPath);
                }
            }
        });
    });
    describe('Performance tests', () => {
        it('should parse JSON files within reasonable time limits', async function () {
            this.timeout(5000); // 5 second timeout
            const startTime = Date.now();
            const filePath = path.join(testDataDir, 'complex-nested.json');
            await (0, parseWhatIfJson_1.parseWhatIfJson)(filePath);
            const endTime = Date.now();
            const duration = endTime - startTime;
            (0, chai_1.expect)(duration).to.be.lessThan(1000); // Should complete within 1 second
        });
        it('should handle multiple concurrent file reads', async function () {
            this.timeout(10000);
            const filePath = path.join(testDataDir, 'minimal-valid.json');
            // Create 10 concurrent parse operations
            const promises = Array.from({ length: 10 }, () => (0, parseWhatIfJson_1.parseWhatIfJson)(filePath));
            const results = await Promise.all(promises);
            (0, chai_1.expect)(results).to.have.lengthOf(10);
            results.forEach(result => {
                (0, chai_1.expect)(result).to.be.an('object');
                (0, chai_1.expect)(result).to.have.property('changes');
            });
        });
    });
});
