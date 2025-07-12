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
const parseWhatIfJson_1 = require("../services/parseWhatIfJson");
describe('Azure DevOps Extension - JSON Parser Tests', function () {
    const testDataDir = path.join(__dirname, 'test-data');
    describe('Valid JSON Parsing', function () {
        it('should parse empty what-if JSON successfully', async function () {
            const testFile = path.join(testDataDir, 'empty.json');
            const result = await (0, parseWhatIfJson_1.parseWhatIfJson)(testFile);
            assert.strictEqual(typeof result, 'object');
            assert.strictEqual(result.status, 'Succeeded');
            assert.strictEqual(Array.isArray(result.changes), true);
            assert.strictEqual(result.changes.length, 0);
            assert.strictEqual(Array.isArray(result.diagnostics), true);
            assert.strictEqual(result.diagnostics.length, 0);
        });
        it('should parse minimal what-if JSON with single create change', async function () {
            const testFile = path.join(testDataDir, 'minimal.json');
            const result = await (0, parseWhatIfJson_1.parseWhatIfJson)(testFile);
            assert.strictEqual(typeof result, 'object');
            assert.strictEqual(result.status, 'Succeeded');
            assert.strictEqual(Array.isArray(result.changes), true);
            assert.strictEqual(result.changes.length, 1);
            const change = result.changes[0];
            assert.strictEqual(change.changeType, 'Create');
            assert.strictEqual(change.after.type, 'Microsoft.Resources/resourceGroups');
            assert.strictEqual(change.before, null);
        });
        it('should parse complex what-if JSON with all change types', async function () {
            const testFile = path.join(testDataDir, 'all-change-types.json');
            const result = await (0, parseWhatIfJson_1.parseWhatIfJson)(testFile);
            assert.strictEqual(typeof result, 'object');
            assert.strictEqual(result.status, 'Succeeded');
            assert.strictEqual(Array.isArray(result.changes), true);
            assert.strictEqual(result.changes.length, 5);
            const changeTypes = result.changes.map((c) => c.changeType);
            assert.strictEqual(changeTypes.includes('Create'), true);
            assert.strictEqual(changeTypes.includes('Modify'), true);
            assert.strictEqual(changeTypes.includes('NoChange'), true);
            assert.strictEqual(changeTypes.includes('Ignore'), true);
            assert.strictEqual(changeTypes.includes('Unsupported'), true);
            // Test modify change has delta
            const modifyChange = result.changes.find((c) => c.changeType === 'Modify');
            assert.strictEqual(Array.isArray(modifyChange.delta), true);
            assert.strictEqual(modifyChange.delta.length, 1);
            assert.strictEqual(modifyChange.delta[0].propertyChangeType, 'Modify');
            // Test unsupported change has reason
            const unsupportedChange = result.changes.find((c) => c.changeType === 'Unsupported');
            assert.strictEqual(typeof unsupportedChange.unsupportedReason, 'string');
            assert.strictEqual(unsupportedChange.unsupportedReason.length > 0, true);
        });
        it('should parse what-if JSON with errors and diagnostics', async function () {
            const testFile = path.join(testDataDir, 'with-errors.json');
            const result = await (0, parseWhatIfJson_1.parseWhatIfJson)(testFile);
            assert.strictEqual(typeof result, 'object');
            assert.strictEqual(result.status, 'Failed');
            assert.strictEqual(Array.isArray(result.changes), true);
            assert.strictEqual(result.changes.length, 0);
            assert.strictEqual(Array.isArray(result.diagnostics), true);
            assert.strictEqual(result.diagnostics.length, 2);
            assert.strictEqual(typeof result.error, 'object');
            assert.strictEqual(result.error.code, 'InvalidTemplate');
        });
        it('should parse actual complex what-if JSON from report.json', async function () {
            const testFile = path.join(__dirname, 'report.json');
            const result = await (0, parseWhatIfJson_1.parseWhatIfJson)(testFile);
            assert.strictEqual(typeof result, 'object');
            assert.strictEqual(result.status, 'Succeeded');
            assert.strictEqual(Array.isArray(result.changes), true);
            assert.strictEqual(result.changes.length > 0, true);
            assert.strictEqual(Array.isArray(result.diagnostics), true);
        });
    });
    describe('Error Handling', function () {
        it('should throw error for non-existent file', async function () {
            const testFile = path.join(testDataDir, 'non-existent.json');
            try {
                await (0, parseWhatIfJson_1.parseWhatIfJson)(testFile);
                assert.fail('Should have thrown an error');
            }
            catch (error) {
                assert.strictEqual(error instanceof Error, true);
                assert.strictEqual(error.message.includes('does not exist'), true);
            }
        });
        it('should throw error for malformed JSON', async function () {
            const testFile = path.join(testDataDir, 'malformed.json');
            try {
                await (0, parseWhatIfJson_1.parseWhatIfJson)(testFile);
                assert.fail('Should have thrown an error');
            }
            catch (error) {
                assert.strictEqual(error instanceof Error, true);
                assert.strictEqual(error.message.includes('Failed to parse what-if JSON'), true);
            }
        });
        it('should handle empty file gracefully', async function () {
            const testFile = path.join(testDataDir, 'empty-file.json');
            await fs.promises.writeFile(testFile, '', 'utf8');
            try {
                await (0, parseWhatIfJson_1.parseWhatIfJson)(testFile);
                assert.fail('Should have thrown an error');
            }
            catch (error) {
                assert.strictEqual(error instanceof Error, true);
                assert.strictEqual(error.message.includes('Failed to parse what-if JSON'), true);
            }
            finally {
                // Clean up
                if (fs.existsSync(testFile)) {
                    await fs.promises.unlink(testFile);
                }
            }
        });
    });
    describe('Structure Validation', function () {
        it('should handle JSON with missing required fields gracefully', async function () {
            const testFile = path.join(testDataDir, 'invalid.json');
            const result = await (0, parseWhatIfJson_1.parseWhatIfJson)(testFile);
            // Should parse but might not have expected structure
            assert.strictEqual(typeof result, 'object');
            // The function currently just parses JSON, so this will succeed
            // but the structure validation would happen at report generation level
        });
        it('should preserve all properties in parsed object', async function () {
            const testFile = path.join(testDataDir, 'minimal.json');
            const result = await (0, parseWhatIfJson_1.parseWhatIfJson)(testFile);
            assert.strictEqual(typeof result, 'object');
            assert.strictEqual(result.hasOwnProperty('changes'), true);
            assert.strictEqual(result.hasOwnProperty('diagnostics'), true);
            assert.strictEqual(result.hasOwnProperty('error'), true);
            assert.strictEqual(result.hasOwnProperty('status'), true);
            assert.strictEqual(result.hasOwnProperty('potentialChanges'), true);
        });
        it('should handle various change types correctly', async function () {
            const testFile = path.join(testDataDir, 'all-change-types.json');
            const result = await (0, parseWhatIfJson_1.parseWhatIfJson)(testFile);
            const changes = result.changes;
            // Test Create change
            const createChange = changes.find((c) => c.changeType === 'Create');
            assert.strictEqual(createChange.before, null);
            assert.strictEqual(typeof createChange.after, 'object');
            // Test Modify change
            const modifyChange = changes.find((c) => c.changeType === 'Modify');
            assert.strictEqual(typeof modifyChange.before, 'object');
            assert.strictEqual(typeof modifyChange.after, 'object');
            assert.strictEqual(Array.isArray(modifyChange.delta), true);
            // Test NoChange
            const noChange = changes.find((c) => c.changeType === 'NoChange');
            assert.strictEqual(typeof noChange.before, 'object');
            assert.strictEqual(typeof noChange.after, 'object');
            assert.strictEqual(Array.isArray(noChange.delta), true);
            // Test Ignore
            const ignoreChange = changes.find((c) => c.changeType === 'Ignore');
            assert.strictEqual(typeof ignoreChange.before, 'object');
            assert.strictEqual(typeof ignoreChange.after, 'object');
            // Test Unsupported
            const unsupportedChange = changes.find((c) => c.changeType === 'Unsupported');
            assert.strictEqual(typeof unsupportedChange.unsupportedReason, 'string');
        });
    });
    describe('Performance and Robustness', function () {
        it('should handle large JSON files efficiently', async function () {
            this.timeout(5000); // 5 second timeout
            const testFile = path.join(__dirname, 'report.json');
            const startTime = Date.now();
            const result = await (0, parseWhatIfJson_1.parseWhatIfJson)(testFile);
            const endTime = Date.now();
            assert.strictEqual(typeof result, 'object');
            assert.strictEqual(endTime - startTime < 1000, true, 'Parsing should complete within 1 second');
        });
        it('should handle JSON with deeply nested structures', async function () {
            const complexJsonContent = {
                changes: [{
                        after: {
                            properties: {
                                virtualNetworkPeerings: [{
                                        properties: {
                                            remoteVirtualNetwork: {
                                                properties: {
                                                    subnets: [{
                                                            properties: {
                                                                routeTable: {
                                                                    properties: {
                                                                        routes: [{
                                                                                properties: {
                                                                                    nextHopIpAddress: "10.0.0.1"
                                                                                }
                                                                            }]
                                                                    }
                                                                }
                                                            }
                                                        }]
                                                }
                                            }
                                        }
                                    }]
                            }
                        },
                        before: null,
                        changeType: "Create",
                        delta: null,
                        resourceId: "/test/resource",
                        deploymentId: null,
                        identifiers: null,
                        symbolicName: null,
                        unsupportedReason: null
                    }],
                diagnostics: [],
                error: null,
                potentialChanges: null,
                status: "Succeeded"
            };
            const testFile = path.join(testDataDir, 'complex-nested.json');
            await fs.promises.writeFile(testFile, JSON.stringify(complexJsonContent, null, 2), 'utf8');
            try {
                const result = await (0, parseWhatIfJson_1.parseWhatIfJson)(testFile);
                assert.strictEqual(typeof result, 'object');
                assert.strictEqual(result.changes[0].after.properties.virtualNetworkPeerings[0].properties.remoteVirtualNetwork.properties.subnets[0].properties.routeTable.properties.routes[0].properties.nextHopIpAddress, "10.0.0.1");
            }
            finally {
                // Clean up
                if (fs.existsSync(testFile)) {
                    await fs.promises.unlink(testFile);
                }
            }
        });
    });
});
