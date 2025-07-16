import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import { getFiles } from '../index';

describe('getFiles() function', () => {
  const testDir = path.join(__dirname, 'temp-test-getFiles');
  const emptyDir = path.join(testDir, 'empty');
  const jsonDir = path.join(testDir, 'json');
  const mixedDir = path.join(testDir, 'mixed');

  beforeEach(async () => {
    // Clean up and create test directories
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    await fs.promises.mkdir(testDir, { recursive: true });
    await fs.promises.mkdir(emptyDir, { recursive: true });
    await fs.promises.mkdir(jsonDir, { recursive: true });
    await fs.promises.mkdir(mixedDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directories
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('successful enumeration scenarios', () => {
    it('should return absolute paths for JSON files in directory', async () => {
      // Create test JSON files
      const jsonFile1 = path.join(jsonDir, 'test1.json');
      const jsonFile2 = path.join(jsonDir, 'test2.json');
      await fs.promises.writeFile(jsonFile1, '{"test": "data1"}', 'utf-8');
      await fs.promises.writeFile(jsonFile2, '{"test": "data2"}', 'utf-8');

      const result = await getFiles(jsonDir);

      expect(result).to.be.an('array');
      expect(result).to.have.length(2);
      expect(result).to.include(path.resolve(jsonFile1));
      expect(result).to.include(path.resolve(jsonFile2));

      // Verify all returned paths are absolute
      result.forEach(filePath => {
        expect(path.isAbsolute(filePath)).to.be.true;
        expect(filePath).to.match(/\.json$/);
      });
    });

    it('should return single file when directory contains one JSON file', async () => {
      const jsonFile = path.join(jsonDir, 'single.json');
      await fs.promises.writeFile(jsonFile, '{"test": "single"}', 'utf-8');

      const result = await getFiles(jsonDir);

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.equal(path.resolve(jsonFile));
    });

    it('should filter out non-JSON files and return only JSON files', async () => {
      // Create mixed file types
      const jsonFile = path.join(mixedDir, 'report.json');
      const txtFile = path.join(mixedDir, 'readme.txt');
      const mdFile = path.join(mixedDir, 'report.md');
      const jsFile = path.join(mixedDir, 'script.js');

      await fs.promises.writeFile(jsonFile, '{"test": "json"}', 'utf-8');
      await fs.promises.writeFile(txtFile, 'text content', 'utf-8');
      await fs.promises.writeFile(mdFile, '# Markdown', 'utf-8');
      await fs.promises.writeFile(jsFile, 'console.log("js");', 'utf-8');

      const result = await getFiles(mixedDir);

      expect(result).to.be.an('array');
      expect(result).to.have.length(1);
      expect(result[0]).to.equal(path.resolve(jsonFile));
      expect(result[0]).to.match(/\.json$/);
    });

    it('should handle files with JSON extension but different cases', async () => {
      const jsonFile1 = path.join(jsonDir, 'test1.json');
      const jsonFile2 = path.join(jsonDir, 'test2.JSON'); // Uppercase extension

      await fs.promises.writeFile(jsonFile1, '{"test": "data1"}', 'utf-8');
      await fs.promises.writeFile(jsonFile2, '{"test": "data2"}', 'utf-8');

      const result = await getFiles(jsonDir);

      expect(result).to.be.an('array');
      // Only lowercase .json should be included based on the implementation
      expect(result).to.have.length(1);
      expect(result[0]).to.equal(path.resolve(jsonFile1));
    });

    it('should return files in consistent order', async () => {
      // Create multiple JSON files with predictable names
      const files = ['a.json', 'b.json', 'c.json'];

      for (const fileName of files) {
        await fs.promises.writeFile(
          path.join(jsonDir, fileName),
          `{"name": "${fileName}"}`,
          'utf-8'
        );
      }

      const result1 = await getFiles(jsonDir);
      const result2 = await getFiles(jsonDir);

      expect(result1).to.be.an('array');
      expect(result1).to.have.length(3);
      expect(result2).to.have.length(3);

      // Results should be consistent between calls
      expect(result1.sort()).to.deep.equal(result2.sort());
    });
  });

  describe('empty directory scenarios', () => {
    it('should return empty array when directory has no files', async () => {
      const result = await getFiles(emptyDir);

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });

    it('should return empty array when directory has no JSON files', async () => {
      // Create non-JSON files
      await fs.promises.writeFile(path.join(mixedDir, 'readme.txt'), 'text', 'utf-8');
      await fs.promises.writeFile(path.join(mixedDir, 'script.js'), 'code', 'utf-8');
      await fs.promises.writeFile(path.join(mixedDir, 'style.css'), 'styles', 'utf-8');

      const result = await getFiles(mixedDir);

      expect(result).to.be.an('array');
      expect(result).to.have.length(0);
    });
  });

  describe('error handling scenarios', () => {
    it('should throw error when directory does not exist', async () => {
      const nonExistentDir = path.join(testDir, 'does-not-exist');

      try {
        await getFiles(nonExistentDir);
        expect.fail('Expected function to throw an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        // Should be a filesystem error about missing directory
        expect((error as Error).message).to.match(/ENOENT|no such file or directory/);
      }
    });

    it('should throw error when path is not a directory', async () => {
      // Create a file (not directory)
      const filePath = path.join(testDir, 'not-a-directory.txt');
      await fs.promises.writeFile(filePath, 'content', 'utf-8');

      try {
        await getFiles(filePath);
        expect.fail('Expected function to throw an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        // Should be a filesystem error about not being a directory
        expect((error as Error).message).to.match(/ENOTDIR|not a directory/);
      }
    });
  });

  describe('using existing test-data directory', () => {
    it('should successfully enumerate JSON files from test-data directory', async () => {
      const testDataDir = path.join(__dirname, 'test-data');

      // This test uses the existing test-data directory
      const result = await getFiles(testDataDir);

      expect(result).to.be.an('array');
      expect(result.length).to.be.greaterThan(0);

      // All results should be absolute paths to JSON files
      result.forEach(filePath => {
        expect(path.isAbsolute(filePath)).to.be.true;
        expect(filePath).to.match(/\.json$/);
        expect(fs.existsSync(filePath)).to.be.true;
      });

      // Should include some of the known test files
      const fileNames = result.map(f => path.basename(f));
      expect(fileNames).to.include('minimal-valid.json');
    });
  });
});
