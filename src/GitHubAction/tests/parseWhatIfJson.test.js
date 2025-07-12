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
const assert = __importStar(require("assert"));
const parseWhatIfJson_1 = require("../services/parseWhatIfJson");
describe('GitHub Action - JSON Parser Tests', function () {
    describe('Valid JSON Parsing', function () {
        it('should parse empty what-if JSON successfully', function () {
            const jsonString = JSON.stringify({
                changes: [],
                diagnostics: [],
                error: null,
                potentialChanges: null,
                status: "Succeeded"
            });
            const result = (0, parseWhatIfJson_1.parseWhatIfJson)(jsonString);
            assert.strictEqual(typeof result, 'object');
            assert.strictEqual(result.status, 'Succeeded');
            assert.strictEqual(Array.isArray(result.changes), true);
            assert.strictEqual(result.changes.length, 0);
            assert.strictEqual(Array.isArray(result.diagnostics), true);
            assert.strictEqual(result.diagnostics.length, 0);
        });
        it('should parse minimal what-if JSON with single create change', function () {
            const jsonString = JSON.stringify({
                changes: [
                    {
                        after: {
                            apiVersion: "2025-03-01",
                            id: "/subscriptions/test-sub/resourceGroups/test-rg",
                            location: "eastus",
                            name: "test-rg",
                            type: "Microsoft.Resources/resourceGroups"
                        },
                        before: null,
                        changeType: "Create",
                        delta: null,
                        deploymentId: null,
                        identifiers: null,
                        resourceId: "/subscriptions/test-sub/resourceGroups/test-rg",
                        symbolicName: null,
                        unsupportedReason: null
                    }
                ],
                diagnostics: [],
                error: null,
                potentialChanges: null,
                status: "Succeeded"
            });
            const result = (0, parseWhatIfJson_1.parseWhatIfJson)(jsonString);
            assert.strictEqual(typeof result, 'object');
            assert.strictEqual(result.status, 'Succeeded');
            assert.strictEqual(Array.isArray(result.changes), true);
            assert.strictEqual(result.changes.length, 1);
            const change = result.changes[0];
            assert.strictEqual(change.changeType, 'Create');
            assert.strictEqual(change.after.type, 'Microsoft.Resources/resourceGroups');
            assert.strictEqual(change.before, null);
        });
        it('should parse complex what-if JSON with all change types', function () {
            const jsonString = JSON.stringify({
                changes: [
                    {
                        after: {
                            apiVersion: "2025-03-01",
                            id: "/subscriptions/test-sub/resourceGroups/test-rg",
                            location: "eastus",
                            name: "test-rg",
                            type: "Microsoft.Resources/resourceGroups"
                        },
                        before: null,
                        changeType: "Create",
                        delta: null,
                        deploymentId: null,
                        identifiers: null,
                        resourceId: "/subscriptions/test-sub/resourceGroups/test-rg",
                        symbolicName: null,
                        unsupportedReason: null
                    },
                    {
                        after: {
                            apiVersion: "2024-07-01",
                            id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Compute/virtualMachines/test-vm",
                            location: "eastus",
                            name: "test-vm",
                            properties: {
                                hardwareProfile: {
                                    vmSize: "Standard_B2s"
                                }
                            },
                            type: "Microsoft.Compute/virtualMachines"
                        },
                        before: {
                            apiVersion: "2024-07-01",
                            id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Compute/virtualMachines/test-vm",
                            location: "eastus",
                            name: "test-vm",
                            properties: {
                                hardwareProfile: {
                                    vmSize: "Standard_B1s"
                                }
                            },
                            type: "Microsoft.Compute/virtualMachines"
                        },
                        changeType: "Modify",
                        delta: [
                            {
                                after: "Standard_B2s",
                                before: "Standard_B1s",
                                children: null,
                                path: "properties.hardwareProfile.vmSize",
                                propertyChangeType: "Modify"
                            }
                        ],
                        deploymentId: null,
                        identifiers: null,
                        resourceId: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Compute/virtualMachines/test-vm",
                        symbolicName: null,
                        unsupportedReason: null
                    },
                    {
                        after: {
                            apiVersion: "2024-05-01",
                            id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Network/virtualNetworks/test-vnet",
                            location: "eastus",
                            name: "test-vnet",
                            type: "Microsoft.Network/virtualNetworks"
                        },
                        before: {
                            apiVersion: "2024-05-01",
                            id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Network/virtualNetworks/test-vnet",
                            location: "eastus",
                            name: "test-vnet",
                            type: "Microsoft.Network/virtualNetworks"
                        },
                        changeType: "NoChange",
                        delta: [],
                        deploymentId: null,
                        identifiers: null,
                        resourceId: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Network/virtualNetworks/test-vnet",
                        symbolicName: null,
                        unsupportedReason: null
                    },
                    {
                        after: {
                            id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Compute/disks/test-disk",
                            location: "eastus",
                            name: "test-disk",
                            type: "Microsoft.Compute/disks"
                        },
                        before: {
                            id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Compute/disks/test-disk",
                            location: "eastus",
                            name: "test-disk",
                            type: "Microsoft.Compute/disks"
                        },
                        changeType: "Ignore",
                        delta: null,
                        deploymentId: null,
                        identifiers: null,
                        resourceId: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Compute/disks/test-disk",
                        symbolicName: null,
                        unsupportedReason: null
                    },
                    {
                        after: {
                            apiVersion: "2024-01-01",
                            id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Network/virtualNetworks/test-vnet/virtualNetworkPeerings/test-peering",
                            name: "test-peering",
                            type: "Microsoft.Network/virtualNetworks/virtualNetworkPeerings"
                        },
                        before: null,
                        changeType: "Unsupported",
                        delta: null,
                        deploymentId: null,
                        identifiers: null,
                        resourceId: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Network/virtualNetworks/test-vnet/virtualNetworkPeerings/test-peering",
                        symbolicName: null,
                        unsupportedReason: "Changes to the resource cannot be analyzed because its resource ID cannot be calculated until deployment is under way."
                    }
                ],
                diagnostics: [
                    {
                        additionalInfo: null,
                        code: "NestedDeploymentShortCircuited",
                        level: "Warning",
                        message: "A nested deployment got short-circuited and all its resources got skipped from validation.",
                        target: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Resources/deployments/test-deployment"
                    }
                ],
                error: null,
                potentialChanges: null,
                status: "Succeeded"
            });
            const result = (0, parseWhatIfJson_1.parseWhatIfJson)(jsonString);
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
        it('should parse what-if JSON with errors and diagnostics', function () {
            const jsonString = JSON.stringify({
                changes: [],
                diagnostics: [
                    {
                        additionalInfo: null,
                        code: "DeploymentFailed",
                        level: "Error",
                        message: "The deployment template is not valid.",
                        target: "/subscriptions/test-sub/resourceGroups/test-rg"
                    },
                    {
                        additionalInfo: null,
                        code: "InvalidTemplate",
                        level: "Error",
                        message: "Required parameter 'location' is missing.",
                        target: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Compute/virtualMachines/test-vm"
                    }
                ],
                error: {
                    code: "InvalidTemplate",
                    message: "Deployment template validation failed"
                },
                potentialChanges: null,
                status: "Failed"
            });
            const result = (0, parseWhatIfJson_1.parseWhatIfJson)(jsonString);
            assert.strictEqual(typeof result, 'object');
            assert.strictEqual(result.status, 'Failed');
            assert.strictEqual(Array.isArray(result.changes), true);
            assert.strictEqual(result.changes.length, 0);
            assert.strictEqual(Array.isArray(result.diagnostics), true);
            assert.strictEqual(result.diagnostics.length, 2);
            assert.strictEqual(typeof result.error, 'object');
            assert.strictEqual(result.error.code, 'InvalidTemplate');
        });
    });
    describe('Error Handling', function () {
        it('should throw error for invalid JSON string', function () {
            const invalidJson = '{ "invalid": json }';
            try {
                (0, parseWhatIfJson_1.parseWhatIfJson)(invalidJson);
                assert.fail('Should have thrown an error');
            }
            catch (error) {
                assert.strictEqual(error instanceof Error, true);
                assert.strictEqual(error.message.includes('Failed to parse what-if JSON'), true);
            }
        });
        it('should throw error for malformed JSON', function () {
            const malformedJson = '{"changes": [{"after": "incomplete';
            try {
                (0, parseWhatIfJson_1.parseWhatIfJson)(malformedJson);
                assert.fail('Should have thrown an error');
            }
            catch (error) {
                assert.strictEqual(error instanceof Error, true);
                assert.strictEqual(error.message.includes('Failed to parse what-if JSON'), true);
            }
        });
        it('should throw error for empty string', function () {
            try {
                (0, parseWhatIfJson_1.parseWhatIfJson)('');
                assert.fail('Should have thrown an error');
            }
            catch (error) {
                assert.strictEqual(error instanceof Error, true);
                assert.strictEqual(error.message.includes('Failed to parse what-if JSON'), true);
            }
        });
        it('should throw error for non-string input', function () {
            try {
                (0, parseWhatIfJson_1.parseWhatIfJson)(null);
                assert.fail('Should have thrown an error');
            }
            catch (error) {
                assert.strictEqual(error instanceof Error, true);
                assert.strictEqual(error.message.includes('Failed to parse what-if JSON'), true);
            }
        });
        it('should throw error for undefined input', function () {
            try {
                (0, parseWhatIfJson_1.parseWhatIfJson)(undefined);
                assert.fail('Should have thrown an error');
            }
            catch (error) {
                assert.strictEqual(error instanceof Error, true);
                assert.strictEqual(error.message.includes('Failed to parse what-if JSON'), true);
            }
        });
    });
    describe('Structure Validation', function () {
        it('should handle JSON with missing required fields gracefully', function () {
            const jsonString = JSON.stringify({
                invalid: "json",
                missing: "required fields"
            });
            const result = (0, parseWhatIfJson_1.parseWhatIfJson)(jsonString);
            // Should parse but might not have expected structure
            assert.strictEqual(typeof result, 'object');
            // The function currently just parses JSON, so this will succeed
            // but the structure validation would happen at report generation level
        });
        it('should preserve all properties in parsed object', function () {
            const jsonString = JSON.stringify({
                changes: [
                    {
                        after: {
                            apiVersion: "2025-03-01",
                            id: "/subscriptions/test-sub/resourceGroups/test-rg",
                            location: "eastus",
                            name: "test-rg",
                            type: "Microsoft.Resources/resourceGroups"
                        },
                        before: null,
                        changeType: "Create",
                        delta: null,
                        deploymentId: null,
                        identifiers: null,
                        resourceId: "/subscriptions/test-sub/resourceGroups/test-rg",
                        symbolicName: null,
                        unsupportedReason: null
                    }
                ],
                diagnostics: [],
                error: null,
                potentialChanges: null,
                status: "Succeeded"
            });
            const result = (0, parseWhatIfJson_1.parseWhatIfJson)(jsonString);
            assert.strictEqual(typeof result, 'object');
            assert.strictEqual(result.hasOwnProperty('changes'), true);
            assert.strictEqual(result.hasOwnProperty('diagnostics'), true);
            assert.strictEqual(result.hasOwnProperty('error'), true);
            assert.strictEqual(result.hasOwnProperty('status'), true);
            assert.strictEqual(result.hasOwnProperty('potentialChanges'), true);
        });
        it('should handle various change types correctly', function () {
            const jsonString = JSON.stringify({
                changes: [
                    {
                        after: { type: "Microsoft.Resources/resourceGroups", name: "test-rg" },
                        before: null,
                        changeType: "Create",
                        delta: null,
                        resourceId: "/test/rg"
                    },
                    {
                        after: { type: "Microsoft.Compute/virtualMachines", name: "test-vm" },
                        before: { type: "Microsoft.Compute/virtualMachines", name: "test-vm" },
                        changeType: "Modify",
                        delta: [{ propertyChangeType: "Modify", path: "properties.vmSize" }],
                        resourceId: "/test/vm"
                    },
                    {
                        after: { type: "Microsoft.Network/virtualNetworks", name: "test-vnet" },
                        before: { type: "Microsoft.Network/virtualNetworks", name: "test-vnet" },
                        changeType: "NoChange",
                        delta: [],
                        resourceId: "/test/vnet"
                    },
                    {
                        after: { type: "Microsoft.Compute/disks", name: "test-disk" },
                        before: { type: "Microsoft.Compute/disks", name: "test-disk" },
                        changeType: "Ignore",
                        delta: null,
                        resourceId: "/test/disk"
                    },
                    {
                        after: { type: "Microsoft.Network/virtualNetworkPeerings", name: "test-peering" },
                        before: null,
                        changeType: "Unsupported",
                        delta: null,
                        resourceId: "/test/peering",
                        unsupportedReason: "Cannot be analyzed"
                    }
                ],
                diagnostics: [],
                error: null,
                status: "Succeeded"
            });
            const result = (0, parseWhatIfJson_1.parseWhatIfJson)(jsonString);
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
        it('should handle large JSON strings efficiently', function () {
            this.timeout(5000); // 5 second timeout
            // Create a large JSON with many changes
            const changes = [];
            for (let i = 0; i < 1000; i++) {
                changes.push({
                    after: {
                        apiVersion: "2025-03-01",
                        id: `/subscriptions/test-sub/resourceGroups/test-rg-${i}`,
                        location: "eastus",
                        name: `test-rg-${i}`,
                        type: "Microsoft.Resources/resourceGroups"
                    },
                    before: null,
                    changeType: "Create",
                    delta: null,
                    deploymentId: null,
                    identifiers: null,
                    resourceId: `/subscriptions/test-sub/resourceGroups/test-rg-${i}`,
                    symbolicName: null,
                    unsupportedReason: null
                });
            }
            const largeJson = JSON.stringify({
                changes,
                diagnostics: [],
                error: null,
                potentialChanges: null,
                status: "Succeeded"
            });
            const startTime = Date.now();
            const result = (0, parseWhatIfJson_1.parseWhatIfJson)(largeJson);
            const endTime = Date.now();
            assert.strictEqual(typeof result, 'object');
            assert.strictEqual(result.changes.length, 1000);
            assert.strictEqual(endTime - startTime < 1000, true, 'Parsing should complete within 1 second');
        });
        it('should handle JSON with deeply nested structures', function () {
            const complexJson = JSON.stringify({
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
                        resourceId: "/test/resource"
                    }],
                diagnostics: [],
                error: null,
                potentialChanges: null,
                status: "Succeeded"
            });
            const result = (0, parseWhatIfJson_1.parseWhatIfJson)(complexJson);
            assert.strictEqual(typeof result, 'object');
            assert.strictEqual(result.changes[0].after.properties.virtualNetworkPeerings[0].properties.remoteVirtualNetwork.properties.subnets[0].properties.routeTable.properties.routes[0].properties.nextHopIpAddress, "10.0.0.1");
        });
        it('should handle JSON with special characters and unicode', function () {
            const jsonWithSpecialChars = JSON.stringify({
                changes: [{
                        after: {
                            name: "test-资源组-ñáme",
                            location: "åsiä-päcífíc",
                            description: "Test with émojí 🔥 and spëciäl çhars"
                        },
                        before: null,
                        changeType: "Create",
                        resourceId: "/subscriptions/test/resources/unicode-test"
                    }],
                diagnostics: [],
                error: null,
                status: "Succeeded"
            });
            const result = (0, parseWhatIfJson_1.parseWhatIfJson)(jsonWithSpecialChars);
            assert.strictEqual(typeof result, 'object');
            assert.strictEqual(result.changes[0].after.name, "test-资源组-ñáme");
            assert.strictEqual(result.changes[0].after.description, "Test with émojí 🔥 and spëciäl çhars");
        });
    });
});
