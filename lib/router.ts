import { NextRequest, NextResponse } from 'next/server';

/**
 * Route handler type
 */
export type RouteHandler = (
  request: NextRequest,
  context: RouteContext
) => Promise<NextResponse> | NextResponse;

/**
 * Middleware type
 */
export type Middleware = (
  request: NextRequest,
  context: RouteContext,
  next: () => Promise<NextResponse>
) => Promise<NextResponse>;

/**
 * Route context with params
 */
export interface RouteContext {
  params: Record<string, string>;
  [key: string]: any;
}

/**
 * Route definition
 */
export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: RouteHandler;
  middleware?: Middleware[];
}

/**
 * Router class for managing API routes
 */
export class Router {
  private routes: Route[] = [];
  private globalMiddleware: Middleware[] = [];

  /**
   * Add global middleware (runs on all routes)
   */
  use(middleware: Middleware) {
    this.globalMiddleware.push(middleware);
    return this;
  }

  /**
   * Register a route
   */
  addRoute(route: Route) {
    this.routes.push(route);
    return this;
  }

  /**
   * Register GET route
   */
  get(path: string, handler: RouteHandler, middleware: Middleware[] = []) {
    return this.addRoute({ method: 'GET', path, handler, middleware });
  }

  /**
   * Register POST route
   */
  post(path: string, handler: RouteHandler, middleware: Middleware[] = []) {
    return this.addRoute({ method: 'POST', path, handler, middleware });
  }

  /**
   * Register PUT route
   */
  put(path: string, handler: RouteHandler, middleware: Middleware[] = []) {
    return this.addRoute({ method: 'PUT', path, handler, middleware });
  }

  /**
   * Register DELETE route
   */
  delete(path: string, handler: RouteHandler, middleware: Middleware[] = []) {
    return this.addRoute({ method: 'DELETE', path, handler, middleware });
  }

  /**
   * Register PATCH route
   */
  patch(path: string, handler: RouteHandler, middleware: Middleware[] = []) {
    return this.addRoute({ method: 'PATCH', path, handler, middleware });
  }

  /**
   * Match route by path and method
   */
  private matchRoute(method: string, pathname: string): {
    route: Route;
    params: Record<string, string>;
  } | null {
    for (const route of this.routes) {
      if (route.method !== method) continue;

      const match = this.matchPath(route.path, pathname);
      if (match) {
        return { route, params: match };
      }
    }
    return null;
  }

  /**
   * Match path pattern with actual path
   * Supports :param syntax
   */
  private matchPath(
    pattern: string,
    pathname: string
  ): Record<string, string> | null {
    // Remove trailing slashes
    pattern = pattern.replace(/\/$/, '');
    pathname = pathname.replace(/\/$/, '');

    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = pathname.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(':')) {
        // Dynamic segment
        const paramName = patternPart.slice(1);
        params[paramName] = pathPart;
      } else if (patternPart !== pathPart) {
        // Static segment mismatch
        return null;
      }
    }

    return params;
  }

  /**
   * Execute middleware chain
   */
  private async executeMiddleware(
    middleware: Middleware[],
    request: NextRequest,
    context: RouteContext,
    finalHandler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    let index = 0;

    const next = async (): Promise<NextResponse> => {
      if (index >= middleware.length) {
        return finalHandler();
      }

      const currentMiddleware = middleware[index++];
      return currentMiddleware(request, context, next);
    };

    return next();
  }

  /**
   * Handle incoming request
   */
  async handle(request: NextRequest): Promise<NextResponse> {
    const { pathname } = new URL(request.url);
    const method = request.method;

    // Match route
    const match = this.matchRoute(method, pathname);

    if (!match) {
      return NextResponse.json(
        { error: 'Not Found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const { route, params } = match;
    const context: RouteContext = { params };

    // Combine global and route-specific middleware
    const allMiddleware = [
      ...this.globalMiddleware,
      ...(route.middleware || []),
    ];

    try {
      // Execute middleware chain
      return await this.executeMiddleware(
        allMiddleware,
        request,
        context,
        async () => route.handler(request, context)
      );
    } catch (error) {
      // Error handling
      console.error('Route error:', error);

      if (error instanceof Error && 'statusCode' in error) {
        const apiError = error as any;
        return NextResponse.json(
          { error: apiError.message, code: apiError.code },
          { status: apiError.statusCode }
        );
      }

      return NextResponse.json(
        { error: 'Internal Server Error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
  }

  /**
   * Get all registered routes (for documentation)
   */
  getRoutes(): Route[] {
    return this.routes;
  }
}

/**
 * Create a new router instance
 */
export function createRouter(): Router {
  return new Router();
}
