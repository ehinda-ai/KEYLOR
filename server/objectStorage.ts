import { Response } from "express";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// Local file representation
export class LocalFile {
  constructor(
    public filePath: string,
    public fileName: string,
  ) {}

  async getMetadata() {
    const stats = await stat(this.filePath);
    return {
      name: this.fileName,
      size: stats.size,
      contentType: this.getContentType(),
      updated: stats.mtime,
    };
  }

  private getContentType(): string {
    const ext = path.extname(this.fileName).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  createReadStream() {
    return fs.createReadStream(this.filePath);
  }

  async exists(): Promise<boolean> {
    return new Promise((resolve) => {
      fs.access(this.filePath, fs.constants.F_OK, (err) => {
        resolve(!err);
      });
    });
  }
}

// Object Storage Service - Uses local filesystem instead of Replit sidecar
export class ObjectStorageService {
  private storageRoot: string;
  private publicDir: string;
  private privateDir: string;

  constructor() {
    // Use environment variable or default to ./storage for development
    this.storageRoot = process.env.STORAGE_PATH || path.join(process.cwd(), 'storage');
    this.publicDir = path.join(this.storageRoot, 'public');
    this.privateDir = path.join(this.storageRoot, '.private');
    
    // Ensure directories exist
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      await mkdir(this.publicDir, { recursive: true });
      await mkdir(this.privateDir, { recursive: true });
      await mkdir(path.join(this.privateDir, 'uploads'), { recursive: true });
    } catch (err) {
      console.error('Failed to create storage directories:', err);
    }
  }

  getPublicObjectSearchPaths(): Array<string> {
    // Return the public directory path
    return [this.publicDir];
  }

  getPrivateObjectDir(): string {
    return this.privateDir;
  }

  // Search for a public object from the search paths
  async searchPublicObject(filePath: string): Promise<LocalFile | null> {
    // Try to find the file in the public directory
    const normalizedPath = filePath.replace(/^\//, '').replace(/\\/g, '/');
    const fullPath = path.join(this.publicDir, normalizedPath);

    // Safety check: ensure the path is within publicDir
    if (!fullPath.startsWith(this.publicDir)) {
      return null;
    }

    try {
      const stats = await stat(fullPath);
      if (stats.isFile()) {
        const fileName = path.basename(fullPath);
        return new LocalFile(fullPath, fileName);
      }
    } catch (err) {
      // File doesn't exist
    }

    return null;
  }

  // Download an object to the response
  async downloadObject(file: LocalFile, res: Response, cacheTtlSec: number = 3600) {
    try {
      const metadata = await file.getMetadata();

      // Set appropriate headers
      res.set({
        'Content-Type': metadata.contentType,
        'Content-Length': metadata.size.toString(),
        'Cache-Control': `public, max-age=${cacheTtlSec}`,
      });

      // Stream the file to the response
      const stream = file.createReadStream();

      stream.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming file' });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error('Error downloading file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error downloading file' });
      }
    }
  }

  // Gets the upload URL for an object entity (returns a path, not a real URL)
  async getObjectEntityUploadURL(
    fileExtension: string = 'jpg',
  ): Promise<{ uploadURL: string; objectPath: string }> {
    const objectId = `${randomUUID()}.${fileExtension}`;
    const uploadDir = path.join(this.privateDir, 'uploads');
    
    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true });

    // For local storage, we return a path that can be used directly
    const uploadPath = path.join(uploadDir, objectId);
    const objectPath = `/objects/uploads/${objectId}`;

    return {
      uploadURL: uploadPath,
      objectPath,
    };
  }

  // Gets the object entity file from the object path
  async getObjectEntityFile(objectPath: string): Promise<LocalFile> {
    if (!objectPath.startsWith('/objects/')) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split('/');
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join('/');
    const filePath = path.join(this.privateDir, entityId);

    // Safety check: ensure the path is within privateDir
    if (!filePath.startsWith(this.privateDir)) {
      throw new ObjectNotFoundError();
    }

    const file = new LocalFile(filePath, path.basename(filePath));
    const exists = await file.exists();

    if (!exists) {
      throw new ObjectNotFoundError();
    }

    return file;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    // For local storage, paths are already normalized
    if (!rawPath.startsWith('http')) {
      return rawPath;
    }

    // Extract path from URL if needed
    try {
      const url = new URL(rawPath);
      const pathname = url.pathname;
      
      // Return normalized path
      if (pathname.startsWith('/objects/')) {
        return pathname;
      }
      
      // Try to extract from file system path
      if (pathname.includes(this.privateDir)) {
        const relativePath = pathname.split(this.privateDir)[1];
        return `/objects${relativePath || ''}`;
      }
    } catch (err) {
      // Invalid URL, return as is
    }

    return rawPath;
  }

  // Save file data directly (for uploads)
  async saveFile(data: Buffer | string, objectPath: string): Promise<void> {
    const file = await this.getObjectEntityFile(objectPath);
    await mkdir(path.dirname(file.filePath), { recursive: true });
    
    if (typeof data === 'string') {
      await writeFile(file.filePath, data, 'base64');
    } else {
      await writeFile(file.filePath, data);
    }
  }

  // List all files in public directory (for carousel, etc)
  async listPublicFiles(prefix: string = ''): Promise<LocalFile[]> {
    try {
      const searchDir = prefix ? path.join(this.publicDir, prefix) : this.publicDir;
      
      // Safety check
      if (!searchDir.startsWith(this.publicDir)) {
        return [];
      }

      if (!fs.existsSync(searchDir)) {
        return [];
      }

      const files = await readdir(searchDir);
      const result: LocalFile[] = [];

      for (const file of files) {
        const filePath = path.join(searchDir, file);
        const stats = await stat(filePath);
        
        if (stats.isFile()) {
          const localFile = new LocalFile(filePath, file);
          result.push(localFile);
        }
      }

      return result;
    } catch (err) {
      console.error('Error listing public files:', err);
      return [];
    }
  }
}

// Export singleton instance
export const objectStorageService = new ObjectStorageService();
