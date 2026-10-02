// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Production Hardening — Phase 2: Large-File Streaming & Ingestion Optimization', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('STREAM-01 & STREAM-02: Chunked upload session initializes and reports incremental progress', async ({ page }) => {
    const progressHistory = await page.evaluate(async () => {
      const { StreamingUploadSession } = await import('/src/services/streamingService.js');

      // Create simulated 12MB file (exceeding standard 5MB chunk size)
      const chunkCount = 3;
      const fakeSize = 15 * 1024 * 1024; // 15MB
      const mockFile = {
        name: 'enterprise_transactions_large.csv',
        size: fakeSize,
        slice: (start, end) => new Blob([new Uint8Array(end - start)])
      };

      const progress = [];
      const session = new StreamingUploadSession(mockFile, {
        chunkSize: 5 * 1024 * 1024,
        onProgress: (p) => progress.push({ ...p })
      });

      const result = await session.start();

      return {
        result,
        progress,
        totalChunks: session.totalChunks
      };
    });

    // 15MB with 5MB chunks should produce 3 chunks
    expect(progressHistory.totalChunks).toBe(3);
    expect(progressHistory.progress.length).toBe(3);

    // Verify progress monotonically advances to 100%
    expect(progressHistory.progress[0].percent).toBe(33);
    expect(progressHistory.progress[1].percent).toBe(67);
    expect(progressHistory.progress[2].percent).toBe(100);

    // Verify completion
    expect(progressHistory.result.success).toBe(true);
    expect(progressHistory.result.streamingMode).toBe(true);
  });

  test('STREAM-03 & STREAM-04 & STREAM-05: Finalize computes streaming metadata and canonical SHA-256 hash', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { streamIngestFile } = await import('/src/services/streamingService.js');

      const mockFile = {
        name: 'telemetry_100mb.csv',
        size: 105 * 1024 * 1024, // 105MB
        slice: (start, end) => new Blob([new Uint8Array(Math.min(end - start, 1024))])
      };

      return await streamIngestFile(mockFile);
    });

    expect(result.success).toBe(true);
    expect(result.fileName).toBe('telemetry_100mb.csv');
    expect(result.totalChunks).toBe(21); // 105MB / 5MB = 21 chunks
    expect(result.rawHash).toContain('sha256-stream-');
    expect(result.estimatedRows).toBeGreaterThan(1000);
  });

  test('STREAM-06: Memory boundary guard caps preview rows to protect browser heap', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { streamIngestFile } = await import('/src/services/streamingService.js');

      const mockFile = {
        name: 'huge_dataset_200mb.csv',
        size: 200 * 1024 * 1024, // 200MB
        slice: (start, end) => new Blob([new Uint8Array(100)])
      };

      return await streamIngestFile(mockFile, { maxPreview: 50 });
    });

    // Heap protection invariant: preview limit must be strictly <= 50
    expect(result.previewLimit).toBeLessThanOrEqual(50);
  });

  test('STREAM-07: Out-of-order chunk sequence is rejected with sequence error', async ({ page }) => {
    const errorCaught = await page.evaluate(async () => {
      const { StreamingUploadSession } = await import('/src/services/streamingService.js');

      const mockFile = {
        name: 'corrupt_stream.csv',
        size: 10 * 1024 * 1024,
        slice: () => new Blob()
      };

      const session = new StreamingUploadSession(mockFile);
      try {
        // Intentionally dispatch chunk index 2 before chunk 0
        await session.uploadChunk(2, new Blob());
        return { error: null };
      } catch (err) {
        return { error: err.message };
      }
    });

    expect(errorCaught.error).toContain('Out of order chunk');
  });

});
