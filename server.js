const express = require('express');
const cors = require('cors');
const { jsonGraphqlExpress } = require('json-graphql-server/node');
const data = require('./db');

const app = express();
const port = Number(process.env.PORT) || 4000;
const allowedOrigins = new Set([
  'https://poki-task.vercel.app',
  'http://localhost:4200',
  'http://127.0.0.1:4200',
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed by CORS'));
    },
  }),
);
app.use('/', jsonGraphqlExpress(data));

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`GraphQL server listening on 0.0.0.0:${port}`);
});

function shutdown(signal) {
  console.log(`${signal} received; shutting down GraphQL server`);
  server.close(() => process.exit(0));
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
