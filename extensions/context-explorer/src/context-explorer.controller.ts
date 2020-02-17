// Copyright IBM Corp. 2020. All Rights Reserved.
// Node module: @loopback/context-explorer
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/* eslint-disable @typescript-eslint/no-unused-vars */
import {Constructor, Context, inject, JSONObject} from '@loopback/context';
import {
  api,
  get,
  param,
  RequestContext,
  Response,
  ResponseObject,
  RestBindings,
} from '@loopback/rest';
import {ContextGraph} from './context-graph';
import {renderGraph} from './visualizer';

const INSPECT_RESPONSE: ResponseObject = {
  description: 'Inspect Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        title: 'InspectResponse',
        additionalProperties: true,
      },
    },
  },
};

export function contextExplorerControllerFactory(
  basePath = '/context-explorer',
): Constructor<unknown> {
  @api({basePath, paths: {}})
  class ContextExplorerController {
    constructor(
      @inject(RestBindings.Http.CONTEXT) private ctx: RequestContext,
    ) {}

    // Map to `GET /inspect`
    @get('/inspect', {
      responses: {
        '200': INSPECT_RESPONSE,
      },
    })
    inspect(
      @param.query.boolean('includeInjections') includeInjections = true,
      @param.query.boolean('includeParent') includeParent = true,
      @param.query.boolean('includeGraph') includeGraph = true,
    ): JSONObject {
      const result = this.ctx.inspect({includeInjections, includeParent});
      if (includeGraph) {
        const graph = new ContextGraph(result).render();
        result.graph = graph;
      }
      return result;
    }

    // Map to `GET /inspect`
    @get('/graph')
    async graph(
      @param.query.boolean('includeInjections') includeInjections = true,
      @param.query.boolean('includeParent') includeParent = true,
      @param.query.string('format') format = 'svg',
    ): Promise<Response> {
      const result = this.ctx.inspect({includeInjections, includeParent});
      const graph = new ContextGraph(result).render();

      if (format === 'dot') {
        this.ctx.response.contentType('text/plain').send(graph);
      } else {
        const svg = await renderGraph(graph);
        this.ctx.response.contentType('image/svg+xml').send(svg);
      }
      return this.ctx.response;
    }

    /**
     * Create an array of graphviz dot graphs for d3 animations
     */
    @get('/dots')
    async dots() {
      let ctx: Context | undefined = this.ctx;
      const dots: string[] = [];
      while (ctx != null) {
        // Add one graph with injections
        const ctxData = ctx.inspect({
          includeParent: true,
          includeInjections: true,
        });
        const graph = new ContextGraph(ctxData).render();
        dots.push(graph);
        ctx = ctx.parent;
      }
      // Show app, app+server, and app+server+request
      return dots.reverse();
    }
  }

  return ContextExplorerController;
}
