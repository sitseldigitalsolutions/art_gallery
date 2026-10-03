/**
 * Malware scanning architecture. The default scanner performs cheap heuristic checks;
 * plug in a ClamAV (clamd TCP) or cloud AV implementation by providing another FileScanner.
 */
export interface ScanResult {
  clean: boolean;
  reason?: string;
}

export interface FileScanner {
  scan(buffer: Buffer): Promise<ScanResult>;
}

const SUSPICIOUS_MARKERS = [Buffer.from('<script', 'latin1'), Buffer.from('<?php', 'latin1'), Buffer.from('#!/', 'latin1')];

export class HeuristicFileScanner implements FileScanner {
  async scan(buffer: Buffer): Promise<ScanResult> {
    // Executable headers (PE "MZ", ELF) disguised as images.
    if (buffer.subarray(0, 2).toString('latin1') === 'MZ') return { clean: false, reason: 'executable' };
    if (buffer.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46]))) return { clean: false, reason: 'executable' };
    const head = buffer.subarray(0, 4096);
    const tail = buffer.subarray(Math.max(0, buffer.length - 4096));
    for (const marker of SUSPICIOUS_MARKERS) {
      if (head.includes(marker) || tail.includes(marker)) return { clean: false, reason: 'embedded script' };
    }
    return { clean: true };
  }
}

export const fileScanner: FileScanner = new HeuristicFileScanner();
