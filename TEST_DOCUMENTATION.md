# JSON Parsing Logic Unit Tests

This directory contains comprehensive unit tests for the Bicep what-if JSON parsing logic for both Azure DevOps Extension and GitHub Action.

## Test Coverage

### Azure DevOps Extension Tests
- **Location**: `src/AzureDevOpsExtension/BicepWhatIfReport/tests/`
- **Total Tests**: 25 tests
- **Test Files**:
  - `parseWhatIfJson.test.ts` - Core JSON parsing functionality tests
  - `integration.test.ts` - Integration and edge case tests

### GitHub Action Tests
- **Location**: `src/GitHubAction/tests/`
- **Total Tests**: 15 tests
- **Test Files**:
  - `parseWhatIfJson.test.ts` - Complete JSON parsing validation tests

## Test Categories

### 1. Valid JSON Parsing
- Empty what-if JSON (no changes)
- Minimal JSON with single create change
- Complex JSON with all change types (Create, Modify, NoChange, Ignore, Unsupported)
- JSON with errors and diagnostics
- Real-world complex JSON from actual Bicep deployments

### 2. Error Handling
- Non-existent files
- Malformed JSON syntax
- Empty files
- Invalid input types (null, undefined, non-string)
- Comprehensive error message validation

### 3. Structure Validation
- JSON with missing required fields
- Property preservation during parsing
- Various change types validation
- Delta arrays and property changes
- Unsupported changes with reasons

### 4. Performance and Robustness
- Large JSON files (performance testing)
- Deeply nested JSON structures
- Unicode and special characters
- Concurrent file access
- Memory usage with large datasets

### 5. Real-world Scenarios (Integration Tests)
- Clean deployments (no changes)
- Diagnostic-only outputs
- Mixed operations (create, modify, delete)
- Error recovery scenarios

### 6. File System Edge Cases
- Files with BOM (Byte Order Mark)
- Different line endings (CRLF vs LF)
- Very long file paths
- Files with null values
- Large string values
- Numeric precision edge cases

## Test Data

### Test Data Files (`test-data/` directory)
- `empty.json` - Empty what-if output
- `minimal.json` - Single resource creation
- `invalid.json` - JSON with missing required fields
- `malformed.json` - Syntactically incorrect JSON
- `all-change-types.json` - Comprehensive change type examples
- `with-errors.json` - JSON with errors and diagnostics

### Dynamic Test Data
Tests also create temporary test files for specific scenarios to ensure comprehensive coverage without cluttering the repository.

## Running Tests

### Azure DevOps Extension
```bash
cd src/AzureDevOpsExtension/BicepWhatIfReport
npm test                    # Run all tests
npm run test:json          # Run only JSON parsing tests
npm run test:integration   # Run only integration tests
```

### GitHub Action
```bash
cd src/GitHubAction
npm test                   # Run all tests
```

## Key Test Scenarios Covered

### Change Types Tested
- **Create**: New resources being added
- **Modify**: Existing resources being changed (with delta arrays)
- **NoChange**: Resources that remain unchanged
- **Ignore**: Resources that are ignored in the what-if analysis
- **Unsupported**: Resources that cannot be analyzed (with unsupported reasons)
- **Delete**: Resources being removed

### JSON Structure Validation
- `changes[]` array with various change objects
- `diagnostics[]` array with warnings and errors
- `error` object for deployment failures
- `status` field (Succeeded, Failed)
- `potentialChanges` handling
- Delta arrays with property change types (Create, Modify, Delete, NoEffect)

### Error Scenarios
- File system errors (missing files, permission issues)
- JSON syntax errors (invalid syntax, missing brackets, etc.)
- Input validation (null, undefined, wrong types)
- Encoding issues (BOM, different line endings)

## Benefits of This Test Suite

1. **Comprehensive Coverage**: Tests all expected JSON structures from Bicep what-if operations
2. **Error Resilience**: Validates proper error handling for various failure modes
3. **Performance Assurance**: Ensures parsing remains efficient for large JSON files
4. **Real-world Validation**: Uses actual Bicep what-if output data for realistic testing
5. **Cross-platform Compatibility**: Tests file system edge cases and encoding issues
6. **Future-proofing**: Comprehensive test coverage ensures new changes don't break existing functionality

## Maintenance

- Tests are organized by functionality for easy maintenance
- Test data is structured to be easily extended with new scenarios
- Each test includes descriptive names and clear assertions
- Temporary files are properly cleaned up after tests
- Tests run independently without dependencies on external resources