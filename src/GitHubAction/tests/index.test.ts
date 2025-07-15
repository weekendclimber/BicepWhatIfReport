import * as core from '@actions/core';

// Mock @actions/core
const mockCore = {
  getInput: jest.fn(),
  setOutput: jest.fn(),
  info: jest.fn(),
  setFailed: jest.fn(),
};

// Replace the actual core functions with mocks
Object.assign(core, mockCore);

describe('GitHub Action - index.ts', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('run function', () => {
    it('should get required input and set output for skeleton implementation', async () => {
      // Mock the getInput to return a test value
      (core.getInput as jest.Mock).mockReturnValue('test-whatif.json');

      // Import and run the action (using dynamic import to ensure mocks are applied)
      const { run } = await import('../index');
      await run();

      // Verify that getInput was called with correct parameters
      expect(core.getInput).toHaveBeenCalledWith('whatif-json', {
        required: true,
      });

      // Verify that setOutput was called with skeleton message
      expect(core.setOutput).toHaveBeenCalledWith(
        'report',
        'GitHub Action implementation in progress'
      );

      // Verify that info was called with skeleton message
      expect(core.info).toHaveBeenCalledWith(
        'GitHub Action skeleton - implementation in progress'
      );

      // Verify that setFailed was not called (success case)
      expect(core.setFailed).not.toHaveBeenCalled();
    });

    it('should handle missing required input', async () => {
      // Mock getInput to throw an error for required input
      (core.getInput as jest.Mock).mockImplementation((name, options) => {
        if (options?.required) {
          throw new Error(`Input required and not supplied: ${name}`);
        }
        return '';
      });

      // Import and run the action
      const { run } = await import('../index');
      await run();

      // Verify that setFailed was called due to missing input
      expect(core.setFailed).toHaveBeenCalledWith(
        expect.stringContaining('Input required and not supplied: whatif-json')
      );
    });

    it('should handle unexpected errors gracefully', async () => {
      // Mock getInput to throw an unexpected error
      (core.getInput as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Import and run the action
      const { run } = await import('../index');
      await run();

      // Verify that setFailed was called with the error
      expect(core.setFailed).toHaveBeenCalledWith(
        'Action failed with error: Error: Unexpected error'
      );
    });

    it('should handle empty input value', async () => {
      // Mock getInput to return empty string
      (core.getInput as jest.Mock).mockReturnValue('');

      // Import and run the action
      const { run } = await import('../index');
      await run();

      // Verify normal flow continues even with empty input (skeleton behavior)
      expect(core.setOutput).toHaveBeenCalledWith(
        'report',
        'GitHub Action implementation in progress'
      );
      expect(core.info).toHaveBeenCalledWith(
        'GitHub Action skeleton - implementation in progress'
      );
      expect(core.setFailed).not.toHaveBeenCalled();
    });

    it('should verify input parameter name and options', async () => {
      (core.getInput as jest.Mock).mockReturnValue('test-input.json');

      const { run } = await import('../index');
      await run();

      // Verify exact input parameters
      expect(core.getInput).toHaveBeenCalledTimes(1);
      expect(core.getInput).toHaveBeenCalledWith('whatif-json', {
        required: true,
      });
    });
  });

  describe('action entry point', () => {
    it('should export run function for testing', async () => {
      // Import the module and check that run function is exported
      const module = await import('../index');

      expect(typeof module.run).toBe('function');
    });
  });

  describe('action output behavior', () => {
    it('should set consistent output format for skeleton implementation', async () => {
      (core.getInput as jest.Mock).mockReturnValue('any-input-value.json');

      const { run } = await import('../index');
      await run();

      // Verify output format consistency
      expect(core.setOutput).toHaveBeenCalledWith(
        'report',
        expect.stringContaining('GitHub Action')
      );
      expect(core.setOutput).toHaveBeenCalledWith(
        'report',
        expect.stringContaining('implementation in progress')
      );
    });

    it('should provide informative message for users', async () => {
      (core.getInput as jest.Mock).mockReturnValue('test.json');

      const { run } = await import('../index');
      await run();

      // Verify user-facing message is informative
      expect(core.info).toHaveBeenCalledWith(
        expect.stringContaining('skeleton')
      );
      expect(core.info).toHaveBeenCalledWith(
        expect.stringContaining('implementation in progress')
      );
    });
  });
});
