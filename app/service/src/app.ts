import 'dotenv/config';

import Fastify, { FastifyInstance } from 'fastify';
import { buildRoute } from '@/routes';
import { RestaurantFinderService } from '@/restaurant-finder.service';
import { fastifyStatic } from '@fastify/static';
import path from 'node:path';

const fastify = Fastify();

const restaurantFinderService = new RestaurantFinderService();

fastify.register(fastifyStatic, {
  root: path.join(__dirname, '/public/client'),
  prefix: '/',
});

fastify.register(
  function (fastify, opt, done) {
    buildRoute(fastify, opt, done);
  },
  { prefix: '/api', rfs: restaurantFinderService }
);

fastify.get('/', function (req, reply) {
  reply.sendFile('index.html');
});

// fastify.setNotFoundHandler((request, reply) => {
//   if (request.raw.url.startsWith('/api')) {
//     reply.code(404).send({ error: 'API route not found' });
//   } else {
//     reply.type('text/html').sendFile('index.html');
//   }
// });

fastify.listen({ host: '0.0.0.0', port: 3000 }, function (err, address) {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.info('Server start at ' + address);
});

process
  .on('uncaughtException', (err) => {
    console.error(`Uncaught Exception: ${err.message}`);
  })
  .on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at ', promise, `reason: ${reason}`);
    // process.exit(1)
  });
