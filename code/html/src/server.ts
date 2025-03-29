// import Fastify, {FastifyInstance, FastifyReply, FastifyRequest, RouteShorthandOptions} from 'fastify';

// const server: FastifyInstance = Fastify({ logger: true });

// const opts: RouteShorthandOptions = {
//     schema: {
//       response: {
//         200: {
//           type: 'object',
//           properties: {
//             pong: {
//               type: 'string'
//             }
//           }
//         }
//       }
//     }
//   };

// server.get('/ping', opts, async (request: FastifyRequest, reply: FastifyReply) => {
//     return { pong: "Hello World!" };
// });

// const start = async (): Promise<void> => {
//     try {
//         await server.listen({ port: 3000, host: '127.0.0.1' });
//     }
//     catch (err) {
//         server.log.error(err);
//         process.exit(1);
//     }
// };

// start();



// // Require the framework and instantiate it

// // ESM
// import Fastify from 'fastify'

// const fastify = Fastify({
//   logger: true
// })

// // Declare a route
// fastify.get('/', function (request, reply) {
//   reply.send({ hello: 'world' })
// })

// // Run the server!
// fastify.listen({ port: 3000 }, function (err, address) {
//   if (err) {
//     fastify.log.error(err)
//     process.exit(1)
//   }
//   // Server is now listening on ${address}
// })



// ESM
import Fastify from 'fastify'

const fastify = Fastify({
  logger: true
})

fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
})

/**
 * Run the server!
 */
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
