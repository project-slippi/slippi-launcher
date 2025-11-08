declare module "medium-json-feed";

// Injected through webpack.DefinePlugin
declare const __VERSION__: string; // App version number
declare const __DATE__: string; // ISO timestamp of build date
declare const __COMMIT__: string; // Short git commit hash

declare module "raw-loader!*.md" {
  const content: string;
  export default content;
}

declare module "dmg" {
  export declare function mount(filename: string, callback: (err: unknown, value: string) => void): string;
  export declare function unmount(mountPath: string, callback: (err: unknown) => void);
}

declare module "stun" {
  export declare type AddressType = {
    address: string;
    port: number;
    family: string;
  };
  export declare type RequestOptions = {
    server: StunServer;
  };
  export declare class StunResponse {
    public getXorAddress(): AddressType;
  }
  export declare class StunServer {
    public close(): void;
  }
  export declare function createServer(options: { type: string }): StunServer;
  export declare function request(url: string, options: RequestOptions): Promise<StunResponse>;
}
