import { FastifyInstance, FastifyRequest, FastifyReply, HookHandlerDoneFunction, FastifyPluginOptions } from 'fastify';
import type { TOption, IExecute } from './types';

function buildRoute(fastify: FastifyInstance, opt: TOption, done: HookHandlerDoneFunction) {
  fastify.post('/execute', async function (req: FastifyRequest<{ Body: IExecute }>, res: FastifyReply) {
    const { prefix, rfs } = opt;
    const { message, location } = req.body;

    if (!message) {
      res.code(400).send({
        message: 'Request body could not be read properly.',
      });

      return;
    }

    const cleanMesage = message.replace(/\\n/g, ' ').replace(/\s+/g, ' ').replace(/\|\s*/g, '|').replace(/\s*\|/g, '|').trim();

    return await rfs.findRestaurant(cleanMesage, location);
  });

  done();
}

export { buildRoute };
