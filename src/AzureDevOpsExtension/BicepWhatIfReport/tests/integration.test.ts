import * as path from 'path';
import * as fs from 'fs';
import * as assert from 'assert';
import { parseWhatIfJson } from '../services/parseWhatIfJson';

describe('Azure DevOps Extension - Integration & Edge Case Tests', function () {
    const testDataDir = path.join(__dirname, 'test-data');

    describe('Real-world Scenarios', function () {
        it('should handle what-if output with no changes (clean deployment)', async function () {
            const testFile = path.join(testDataDir, 'empty.json');
            const result = await parseWhatIfJson(testFile);
            
            assert.strictEqual((result as any).status, 'Succeeded');
            assert.strictEqual((result as any).changes.length, 0);
            assert.strictEqual((result as any).error, null);
        });

        it('should handle what-if output with only diagnostic warnings', async function () {
            const diagnosticsOnlyContent = {
                changes: [],
                diagnostics: [
                    {
                        code: "BCP081",
                        level: "Warning",
                        message: "Resource type 'Microsoft.Storage/storageAccounts@2021-06-01' does not have types available for API version '2021-06-01'.",
                        target: "resources[0]"
                    }
                ],
                error: null,
                status: "Succeeded"
            };
            
            const testFile = path.join(testDataDir, 'diagnostics-only.json');
            await fs.promises.writeFile(testFile, JSON.stringify(diagnosticsOnlyContent, null, 2), 'utf8');
            
            try {
                const result = await parseWhatIfJson(testFile);
                assert.strictEqual((result as any).status, 'Succeeded');
                assert.strictEqual((result as any).changes.length, 0);
                assert.strictEqual((result as any).diagnostics.length, 1);
                assert.strictEqual((result as any).diagnostics[0].level, 'Warning');
            } finally {
                if (fs.existsSync(testFile)) {
                    await fs.promises.unlink(testFile);
                }
            }
        });

        it('should handle mixed create, modify, and delete operations', async function () {
            const mixedOperationsContent = {
                changes: [
                    {
                        changeType: "Create",
                        after: { name: "new-resource", type: "Microsoft.Storage/storageAccounts" },
                        before: null,
                        resourceId: "/subscriptions/test/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/new-resource"
                    },
                    {
                        changeType: "Modify",
                        after: { name: "existing-resource", location: "eastus2" },
                        before: { name: "existing-resource", location: "eastus" },
                        delta: [{ path: "location", propertyChangeType: "Modify", after: "eastus2", before: "eastus" }],
                        resourceId: "/subscriptions/test/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/existing-resource"
                    },
                    {
                        changeType: "Delete",
                        after: null,
                        before: { name: "old-resource", type: "Microsoft.Storage/storageAccounts" },
                        resourceId: "/subscriptions/test/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/old-resource"
                    }
                ],
                diagnostics: [],
                error: null,
                status: "Succeeded"
            };
            
            const testFile = path.join(testDataDir, 'mixed-operations.json');
            await fs.promises.writeFile(testFile, JSON.stringify(mixedOperationsContent, null, 2), 'utf8');
            
            try {
                const result = await parseWhatIfJson(testFile);
                assert.strictEqual((result as any).status, 'Succeeded');
                assert.strictEqual((result as any).changes.length, 3);
                
                const createChange = (result as any).changes.find((c: any) => c.changeType === 'Create');
                const modifyChange = (result as any).changes.find((c: any) => c.changeType === 'Modify');
                const deleteChange = (result as any).changes.find((c: any) => c.changeType === 'Delete');
                
                assert.strictEqual(createChange.before, null);
                assert.strictEqual(deleteChange.after, null);
                assert.strictEqual(Array.isArray(modifyChange.delta), true);
            } finally {
                if (fs.existsSync(testFile)) {
                    await fs.promises.unlink(testFile);
                }
            }
        });
    });

    describe('File System Edge Cases', function () {
        it('should handle files with BOM (Byte Order Mark) by throwing helpful error', async function () {
            const jsonContent = JSON.stringify({
                changes: [],
                diagnostics: [],
                error: null,
                status: "Succeeded"
            });
            
            // Add BOM (UTF-8 BOM: 0xEF, 0xBB, 0xBF)
            const bomBuffer = Buffer.from([0xEF, 0xBB, 0xBF]);
            const contentBuffer = Buffer.from(jsonContent, 'utf8');
            const fileBuffer = Buffer.concat([bomBuffer, contentBuffer]);
            
            const testFile = path.join(testDataDir, 'bom-file.json');
            await fs.promises.writeFile(testFile, fileBuffer);
            
            try {
                // BOM should cause a parsing error with current implementation
                await parseWhatIfJson(testFile);
                assert.fail('Should have thrown an error due to BOM');
            } catch (error) {
                assert.strictEqual(error instanceof Error, true);
                assert.strictEqual((error as Error).message.includes('Failed to parse what-if JSON'), true);
                // This demonstrates a known limitation - BOM handling would need special treatment
            } finally {
                if (fs.existsSync(testFile)) {
                    await fs.promises.unlink(testFile);
                }
            }
        });

        it('should handle files with different line endings (CRLF vs LF)', async function () {
            const jsonContent = {
                changes: [],
                diagnostics: [],
                error: null,
                status: "Succeeded"
            };
            
            // Test with CRLF line endings
            const crlfContent = JSON.stringify(jsonContent, null, 2).replace(/\n/g, '\r\n');
            const testFile = path.join(testDataDir, 'crlf-file.json');
            await fs.promises.writeFile(testFile, crlfContent, 'utf8');
            
            try {
                const result = await parseWhatIfJson(testFile);
                assert.strictEqual((result as any).status, 'Succeeded');
            } finally {
                if (fs.existsSync(testFile)) {
                    await fs.promises.unlink(testFile);
                }
            }
        });

        it('should handle very long file paths', async function () {
            // Create a nested directory structure to test long paths
            const longPath = path.join(testDataDir, 'very', 'deeply', 'nested', 'directory', 'structure', 'for', 'testing', 'long', 'file', 'paths');
            await fs.promises.mkdir(longPath, { recursive: true });
            
            const jsonContent = JSON.stringify({
                changes: [],
                diagnostics: [],
                error: null,
                status: "Succeeded"
            });
            
            const testFile = path.join(longPath, 'test-file-with-long-path.json');
            await fs.promises.writeFile(testFile, jsonContent, 'utf8');
            
            try {
                const result = await parseWhatIfJson(testFile);
                assert.strictEqual((result as any).status, 'Succeeded');
            } finally {
                if (fs.existsSync(testFile)) {
                    await fs.promises.unlink(testFile);
                }
                // Clean up the directory structure
                await fs.promises.rm(path.join(testDataDir, 'very'), { recursive: true });
            }
        });
    });

    describe('JSON Content Edge Cases', function () {
        it('should handle JSON with null values in expected places', async function () {
            const jsonWithNulls = {
                changes: [
                    {
                        after: null,
                        before: { name: "deleted-resource" },
                        changeType: "Delete",
                        delta: null,
                        deploymentId: null,
                        identifiers: null,
                        resourceId: "/test/resource",
                        symbolicName: null,
                        unsupportedReason: null
                    }
                ],
                diagnostics: [],
                error: null,
                potentialChanges: null,
                status: "Succeeded"
            };
            
            const testFile = path.join(testDataDir, 'nulls.json');
            await fs.promises.writeFile(testFile, JSON.stringify(jsonWithNulls, null, 2), 'utf8');
            
            try {
                const result = await parseWhatIfJson(testFile);
                assert.strictEqual((result as any).changes[0].after, null);
                assert.strictEqual((result as any).changes[0].delta, null);
                assert.strictEqual((result as any).error, null);
            } finally {
                if (fs.existsSync(testFile)) {
                    await fs.promises.unlink(testFile);
                }
            }
        });

        it('should handle JSON with empty arrays and objects', async function () {
            const jsonWithEmpties = {
                changes: [],
                diagnostics: [],
                error: null,
                potentialChanges: null,
                status: "Succeeded",
                metadata: {},
                additionalInfo: []
            };
            
            const testFile = path.join(testDataDir, 'empties.json');
            await fs.promises.writeFile(testFile, JSON.stringify(jsonWithEmpties, null, 2), 'utf8');
            
            try {
                const result = await parseWhatIfJson(testFile);
                assert.strictEqual(Array.isArray((result as any).changes), true);
                assert.strictEqual((result as any).changes.length, 0);
                assert.strictEqual(typeof (result as any).metadata, 'object');
                assert.strictEqual(Object.keys((result as any).metadata).length, 0);
            } finally {
                if (fs.existsSync(testFile)) {
                    await fs.promises.unlink(testFile);
                }
            }
        });

        it('should handle JSON with very large string values', async function () {
            const largeString = 'x'.repeat(10000); // 10KB string
            const jsonWithLargeString = {
                changes: [
                    {
                        after: {
                            name: "test-resource",
                            properties: {
                                largeProperty: largeString,
                                description: largeString
                            }
                        },
                        before: null,
                        changeType: "Create",
                        resourceId: "/test/resource"
                    }
                ],
                diagnostics: [],
                error: null,
                status: "Succeeded"
            };
            
            const testFile = path.join(testDataDir, 'large-strings.json');
            await fs.promises.writeFile(testFile, JSON.stringify(jsonWithLargeString, null, 2), 'utf8');
            
            try {
                const result = await parseWhatIfJson(testFile);
                assert.strictEqual((result as any).changes[0].after.properties.largeProperty.length, 10000);
                assert.strictEqual((result as any).changes[0].after.properties.description.length, 10000);
            } finally {
                if (fs.existsSync(testFile)) {
                    await fs.promises.unlink(testFile);
                }
            }
        });

        it('should handle JSON with numeric precision edge cases', async function () {
            const jsonWithNumbers = {
                changes: [
                    {
                        after: {
                            properties: {
                                veryLargeNumber: 9007199254740991, // MAX_SAFE_INTEGER
                                verySmallNumber: -9007199254740991,
                                floatingPoint: 3.141592653589793,
                                scientificNotation: 1.23e-10,
                                zero: 0,
                                negativeZero: -0
                            }
                        },
                        before: null,
                        changeType: "Create",
                        resourceId: "/test/resource"
                    }
                ],
                diagnostics: [],
                error: null,
                status: "Succeeded"
            };
            
            const testFile = path.join(testDataDir, 'numbers.json');
            await fs.promises.writeFile(testFile, JSON.stringify(jsonWithNumbers, null, 2), 'utf8');
            
            try {
                const result = await parseWhatIfJson(testFile);
                const props = (result as any).changes[0].after.properties;
                assert.strictEqual(props.veryLargeNumber, 9007199254740991);
                assert.strictEqual(props.verySmallNumber, -9007199254740991);
                assert.strictEqual(typeof props.floatingPoint, 'number');
                assert.strictEqual(props.zero, 0);
            } finally {
                if (fs.existsSync(testFile)) {
                    await fs.promises.unlink(testFile);
                }
            }
        });
    });

    describe('Error Recovery and Resilience', function () {
        it('should provide helpful error messages for common JSON syntax errors', async function () {
            const commonErrors = [
                { content: '{"changes": [}', expectedError: 'Unexpected token' },
                { content: '{"changes": "missing comma" "status": "test"}', expectedError: 'Unexpected string' },
                { content: '{"changes": [,]}', expectedError: 'Unexpected token' },
                { content: '{"trailing": "comma",}', expectedError: 'Unexpected token' }
            ];
            
            for (let i = 0; i < commonErrors.length; i++) {
                const errorCase = commonErrors[i];
                const testFile = path.join(testDataDir, `error-case-${i}.json`);
                await fs.promises.writeFile(testFile, errorCase.content, 'utf8');
                
                try {
                    await parseWhatIfJson(testFile);
                    assert.fail(`Should have thrown an error for case ${i}`);
                } catch (error) {
                    assert.strictEqual(error instanceof Error, true);
                    assert.strictEqual((error as Error).message.includes('Failed to parse what-if JSON'), true);
                } finally {
                    if (fs.existsSync(testFile)) {
                        await fs.promises.unlink(testFile);
                    }
                }
            }
        });

        it('should handle concurrent file access gracefully', async function () {
            const jsonContent = JSON.stringify({
                changes: [],
                diagnostics: [],
                error: null,
                status: "Succeeded"
            });
            
            const testFile = path.join(testDataDir, 'concurrent-access.json');
            await fs.promises.writeFile(testFile, jsonContent, 'utf8');
            
            try {
                // Test multiple concurrent reads
                const promises = Array.from({ length: 10 }, () => parseWhatIfJson(testFile));
                const results = await Promise.all(promises);
                
                // All results should be identical
                results.forEach(result => {
                    assert.strictEqual((result as any).status, 'Succeeded');
                });
            } finally {
                if (fs.existsSync(testFile)) {
                    await fs.promises.unlink(testFile);
                }
            }
        });
    });
});