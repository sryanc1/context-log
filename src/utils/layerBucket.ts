const LAYER_BUCKET_COUNT = 3;

export function getLayerBucket(projectId: string): number {
    let hash = 0;
    for (let i = 0; i < projectId.length; i++) {
        hash = (hash * 31 + projectId.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % LAYER_BUCKET_COUNT;
}

export { LAYER_BUCKET_COUNT };