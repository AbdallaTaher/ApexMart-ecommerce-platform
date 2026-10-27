import { describe, it, expect, vi } from 'vitest';
const catchAsync = require('../../backend/utils/catchAsync');

describe('catchAsync Utility Unit Tests', () => {
  it('should execute successfully when async handler resolves without error', async () => {
    const mockHandler = vi.fn().mockResolvedValue('success');
    const req = {};
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    const wrapped = catchAsync(mockHandler);
    wrapped(req, res, next);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockHandler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('should catch rejection and forward error to next() callback', async () => {
    const error = new Error('Async failure simulation');
    const mockHandler = vi.fn().mockRejectedValue(error);
    const req = {};
    const res = {};
    const next = vi.fn();

    const wrapped = catchAsync(mockHandler);
    wrapped(req, res, next);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockHandler).toHaveBeenCalledWith(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(error);
  });
});
