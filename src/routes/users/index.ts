import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createUserBodySchema, changeUserBodySchema, subscribeBodySchema } from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return await fastify.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;
      const findedUser = await fastify.db.users.findOne({ equals: id, key: 'id' });

      if (!findedUser) {
        throw fastify.httpErrors.notFound(`The user with this ID:${id} was not found`);
      }

      return findedUser;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { body } = request;
      return await fastify.db.users.create(body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;
      const deletedUser = await fastify.db.users.delete(id);

      if (!deletedUser) {
        throw fastify.httpErrors.notFound(`The user with this ID:${id} was not found`);
      }

      return deletedUser;
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const {
        body: { userId },
        params: { id },
      } = request;
      const targetUser = await fastify.db.users.findOne({ equals: id, key: 'id' });

      if (!targetUser) {
        throw fastify.httpErrors.notFound(`The user with this ID:${id} was not found`);
      }

      const subscriber = await fastify.db.users.findOne({ equals: userId, key: 'id' });

      if (!subscriber) {
        throw fastify.httpErrors.notFound(`The subscriber with this ID:${userId} was not found`);
      }

      subscriber.subscribedToUserIds.push(id);

      await fastify.db.users.change(userId, subscriber);

      return targetUser;
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const {
        body: { userId },
        params: { id },
      } = request;
      const targetUser = await fastify.db.users.findOne({ equals: id, key: 'id' });

      if (!targetUser) {
        throw fastify.httpErrors.notFound(`The user with this ID:${id} was not found`);
      }

      const subscriber = await fastify.db.users.findOne({ equals: userId, key: 'id' });

      if (!subscriber) {
        throw fastify.httpErrors.notFound(`The subscriber with this ID:${userId} was not found`);
      }

      const subscrebersWithoutTargetUser = subscriber.subscribedToUserIds.filter((subscribedUserId) => subscribedUserId !== id);

      await fastify.db.users.change(userId, { ...subscriber, subscribedToUserIds: subscrebersWithoutTargetUser });

      return targetUser;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;

      const updatedUser = await fastify.db.users.findOne({ equals: id, key: 'id' });

      if (!updatedUser) {
        throw fastify.httpErrors.notFound(`The user with this ID:${id} was not found`);
      }

      return await fastify.db.users.change(id, request.body);
    }
  );
};

export default plugin;
