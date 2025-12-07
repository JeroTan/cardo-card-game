import cors from "@elysiajs/cors";


const whiteList = [
  /.*cardo-card-game-development.mekina-game-studio.workers.dev/,
  /.*localhost:300/,
];

export default function getCorsConfig() {
  return cors({
    origin: (request: Request) => {
      let url = request.url;
      console.log(`URL of Requester: ${request.url}`);
      if(!url) //If no origin, deny. They may run it outside of browser
        return false;
      return whiteList.some((allowedOrigin) => {
        if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(url);
        }
        return allowedOrigin === url;
      });
    },
    methods: ["GET", "POST", "PATCH", "PUT", "OPTIONS"],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ["X-Request-Id", "X-Response-Time"],
    credentials: false,
    maxAge: 3600,
  });
}