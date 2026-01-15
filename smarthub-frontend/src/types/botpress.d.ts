// types/botpress.d.ts
export {};

declare global {
  interface Window {
    botpressWebChat?: {
      init: (config: any) => {
        onEvent: (callback: (event: any) => void) => void;
        sendEvent: (event: any) => void;
        mount: (element: HTMLElement | null) => void;
        destroy?: () => void;
      };
    };
  }
}