/// <reference types="node" />
import { FastifyPluginCallback, FastifyContextConfig } from 'fastify';
import Ajv from 'ajv';

interface FastifySplitValidator {
  defaultValidator?: Ajv;
}

declare module 'fastify' {
  interface FastifyContextConfig {
    schemaValidators: {
      body?: Ajv;
      headers?: Ajv;
      querystring?: Ajv;
      query?: Ajv;
      params?: Ajv;
    };
  }
}

declare const FastifySplitValidator: FastifyPluginCallback<FastifySplitValidator>;

export default FastifySplitValidator;
