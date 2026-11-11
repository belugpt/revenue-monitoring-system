declare namespace Cloudflare {
  interface Env {
    STANDALONE_AUTH?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
