/** Canvas/thumbnail helper. PNG sprites are not free-camera 3D meshes. */
export type Frame = { x: number; y: number; width: number; height: number };
export type ArtAsset = {
  id: string; nameVi: string; atlas: string; frame: Frame;
  anchor: { x: number; y: number };
};
export type Manifest = { assets: ArtAsset[] };

export class BuildingAtlasLoader {
  private index: Map<string, ArtAsset>;
  private cache = new Map<string, Promise<HTMLImageElement>>();
  constructor(manifest: Manifest, private baseUrl: string, private maxAtlases = 4) {
    this.index = new Map(manifest.assets.map(asset => [asset.id, asset]));
    if (this.index.size !== manifest.assets.length) throw new Error('Duplicate art IDs');
    if (!Number.isInteger(maxAtlases) || maxAtlases < 1) throw new Error('Invalid cache limit');
  }
  asset(id: string): ArtAsset {
    const asset = this.index.get(id);
    if (!asset) throw new Error(`Unknown art ID: ${id}`);
    return asset;
  }
  async load(id: string): Promise<{ asset: ArtAsset; image: HTMLImageElement }> {
    const asset = this.asset(id);
    const url = new URL(asset.atlas, this.baseUrl).href;
    let pending = this.cache.get(url);
    if (pending) {
      this.cache.delete(url); this.cache.set(url, pending);
    } else {
      pending = new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load atlas: ${asset.atlas}`));
        image.src = url;
      });
      this.cache.set(url, pending);
      while (this.cache.size > this.maxAtlases) {
        const oldest = this.cache.keys().next().value;
        if (oldest !== undefined) this.cache.delete(oldest);
      }
    }
    try {
      const image = await pending;
      const f = asset.frame;
      if (![f.x, f.y, f.width, f.height].every(Number.isFinite)
        || f.width <= 0 || f.height <= 0 || f.x < 0 || f.y < 0
        || f.x + f.width > image.naturalWidth || f.y + f.height > image.naturalHeight) {
        throw new Error(`Invalid atlas frame: ${id}`);
      }
      return { asset, image };
    } catch (error) {
      if (this.cache.get(url) === pending) this.cache.delete(url);
      throw error;
    }
  }
  async drawThumbnail(ctx: CanvasRenderingContext2D, id: string,
    x: number, y: number, boxWidth: number, boxHeight: number): Promise<void> {
    const { asset, image } = await this.load(id);
    const f = asset.frame;
    const scale = Math.min(boxWidth / f.width, boxHeight / f.height);
    const width = f.width * scale, height = f.height * scale;
    ctx.drawImage(image, f.x, f.y, f.width, f.height,
      x + (boxWidth - width) / 2, y + (boxHeight - height) / 2, width, height);
  }
  clear(): void { this.cache.clear(); }
}

// Example in a real application: await fetch the manifest once, then:
// const loader = new BuildingAtlasLoader(manifest,
//   new URL('/assets/build-city-26-art/', window.location.origin).href);
// await loader.drawThumbnail(ctx, 'surface-water-pump', 0, 0, 160, 160);
// In virtualized UI, cancel/discard stale draws when the selected card changes.
// This cache drops JS references; it does not guarantee immediate GPU/OS release.
