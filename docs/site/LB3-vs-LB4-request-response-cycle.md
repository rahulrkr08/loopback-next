---
lang: en
title: 'Differences in LoopBack 3 and LoopBack 4 request/response cycle'
keywords: LoopBack 4.0, LoopBack 4, LoopBack 3.0, LoopBack 3
sidebar: lb4_sidebar
permalink: /doc/en/lb4/LB3-vs-LB4-request-response-cycle.html
---

## Differences between LoopBack 3 and LoopBack 4 request/response cycle

The request/response cycle infrastructure and pathway are very different in
LoopBack 3 and LoopBack 4. Knowing the differences will help you migrate
LoopBack 3 apps to LoopBack 4 and implement new request/response related
features in LoopBack 4.

This document will guide you through the differences and show the LoopBack 4
equivalent, if there is any.

### Request/response infrastructure

The difference begins with the LoopBack application object itself. In
LoopBack 3, it is an instance of an Express app; in LoopBack 4, it is not.
Although LoopBack 4 uses Express as the HTTP server, it is not directly exposed
anymore.

In LoopBack 3, Express middleware and routers, models, components, boot scripts,
and remote methods are the ways endpoints can be created on the app. Let's take
a look at how they have changed and how their functionality can be migrated in
LoopBack 4.

#### Express middleware and routers

In LoopBack 3 you could add routes and load custom middleware using `app.get()`,
`app.post()`, `app.use()`, etc., just like how you do in Express.
In LoopBack 4, you cannot do it yet. However, you can
[mount a LoopBack 4](https://loopback.io/doc/en/lb4/express-with-lb4-rest-tutorial.html)
on an Express app, which would allow you to still use the familiar routing
methods.

{% include tip.html content="Follow our GitHub issues
[#1293](https://github.com/strongloop/loopback-next/issues/1293)
and
[#2035](https://github.com/strongloop/loopback-next/issues/2035)
to track the progress on supporting Express middlweware in LoopBack 4." %}

If you want to mount a Express router, you can use the
[RestApplication.mountExpressRouter()](https://loopback.io/doc/en/lb4/apidocs.rest.restapplication.mountexpressrouter.html)
API.

Using [Controllers](https://loopback.io/doc/en/lb4/Controllers.html) is the
recommended way for creating custom (and REST) endpoints on your app. Its
support for
[dependency injection](https://loopback.io/doc/en/lb4/Dependency-injection.html)
and [Interceptors](https://loopback.io/doc/en/lb4/Interceptors.html) makes it a
very powerful extension mechanism.

In LoopBack 4
[middleware.json](https://loopback.io/doc/en/lb3/middleware.json.html)
is not required anymore because of architectural changes.

#### Models

In LoopBack 3, models files automatically create the corresponding REST API
endpoints and the database query machinery (using the configured datasource).
In LoopBack 4, model files are limited only to describing the properties of the
data. You will have to create a corresponding
[Repository](https://loopback.io/doc/en/lb4/Repositories.html)
for database connectivity, and
[controllers](https://loopback.io/doc/en/lb4/Controllers.html)
for creating the REST API endpoint.

The fact that you have to create two more artifacts along with the model to
get a REST endpoint working might seem overly tedious at first. However, the
separation of concerns and decoupling the functionality makes the codebase
cleaner, easier to maintain, and much easier to customize functionality at
various levels. This can be better appreciated as the complexity of your app
grows.

For those who are uncomfortable with the concept of having to creating a
repository and a controller for a model, we have a component
[@loopback/rest-crud
](https://loopback.io/doc/en/lb4/Creating-crud-rest-apis.html)
; with a little bit of configuration, a model file is all you will need to
create the REST endpoints. Once your requirements outgrow what
`@loopback/rest-crud` provides, you can implement your REST endpoints the
idiomatic way.

#### Components

Components are still supported in LoopBack 4, but the concept of component
has completely changed.

In LoopBack 3, a
[component](https://loopback.io/doc/en/lb3/LoopBack-components.html)
is a simple Node.js module which exports a function with the signature
`function(app, options)`. In LoopBack 4, a
[component](https://loopback.io/doc/en/lb4/Creating-components.html)
is a TypeScript class which can add
[servers](https://loopback.io/doc/en/lb4/Server.html),
[observers](https://loopback.io/doc/en/lb4/Life-cycle.html),
[providers](https://loopback.io/doc/en/lb4/Creating-components.html#providers),
and controllers to the app using dependency injection.

LoopBack 3 components adding routes can be migrated to LoopBack 4 by moving the
functionality to the controller of a LoopBack 4 component.

Here is an example of migrating a LoopBack 3 routing component to a LoopBack 4
component's controller.

{% include code-caption.html content="server/hi-component.js" %}

```js
module.exports = (app, options) => {
  app.get('/hi', (req, res) => {
    res.send('Hi!');
  });
};
```

{% include code-caption.html content="src/components/hi.component.ts" %}

```ts
import {get} from '@loopback/rest';
import {Component} from '@loopback/core';

export class HiController {
  @get('/hi')
  hello(): string {
    return 'Hi!';
  }
}

export class HiComponent implements Component {
  controllers = [HiController];
}
```

{% include code-caption.html content="src/application.ts" %}

```ts
import { HiComponent} from './components/hi.component';
...
export class Lb4AppApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    ...
    this.component(HiComponent);
    ...
  }
}
```

Because of the architectural changes, `component-config.json` is not required
in LoopBack 4 anymore.

#### Boot scripts

If you used LoopBack 3 boot scripts for adding routes to the app, it
should now be moved to a standalone controller, a component, or implemented
using `app.mountExpressRouter()`.

Here is an example of migrating a route added by a boot script to a controller.

{% include code-caption.html content="server/boot/hello.js" %}

```js
module.exports = function(server) {
  server.get('/hello', (req, res) => {
    res.send('Hello!');
  });
};
```

{% include code-caption.html content="src/controllers/hello.ts" %}

```ts
import {get} from '@loopback/rest';

export class HelloController {
  @get('/hello')
  hello(): string {
    return 'Hello!';
  }
}
```

{% include tip.html content="For details about migrating LoopBack 3 boot scripts
refer to
[Migrating boot scripts](https://loopback.io/doc/en/lb4/migration-boot-scripts.html)
." %}

#### Remote methods

[Remote methods](https://loopback.io/doc/en/lb3/Remote-methods.html) add custom
endpoints to a model's REST interface.

{% include code-caption.html content="server/models/person.js" %}

```js
module.exports = function(Person) {
  Person.greet = function(message, cb) {
    cb(null, 'Greetings: ' + message);
  }

  Person.remoteMethod('greet', {
    accepts: {arg: 'message', type: 'string'},
    returns: {arg: 'message', type: 'string'}
  });
};
```

The above remote method's functionality can be migrated to a controller in
LoopBack 4 in the following manner.

{% include code-caption.html content="src/controllers/person.ts" %}

```ts
import {post, requestBody} from '@loopback/rest';

export type Greeting = {
  message: string;
}

const spec = {
  content: {'application/json': {schema: {
    type: 'object',
    properties: {
      message: {
        type: 'string'
      }
    }
  }}}
};

export class PersonController {
  @post('/person/greet', {
    responses: {
      '200': spec,
    },
  })
  greet(@requestBody(spec) greeting: Greeting): string {
    return 'Greetings: ' + greeting.message;
  }
}
```

### Request/response pathway

The request/response architecture has undergone a drastic change in LoopBack 4.
LoopBack 3's
[phase-based middleware routing system](https://loopback.io/doc/en/lb3/Routing.html)
is now replaced by a
[sequence handler](https://loopback.io/doc/en/lb4/apidocs.rest.defaultsequence.html)
that sits infront of a
[routing table](https://loopback.io/doc/en/lb4/apidocs.rest.routingtable.html).

In LoopBack 3, middleware are added using Express APIs and via phases in
`middleware.json` or using
[app.middleware()](https://apidocs.loopback.io/loopback/#app-middleware).
Request to the app passes through the middleware chain in the following order.

- `initial:before`
- `initial`
- `initial:after`
- `session:before`
- `session`
- `session:after`
- `auth:before`
- `auth`
- `auth:after`
- `parse:before`
- `parse`
- `parse:after`
- `routes:before`
- [Express middleware](http://expressjs.com/guide/writing-middleware.html)
- [Components](https://loopback.io/doc/en/lb3/LoopBack-components.html)
- [Boot scripts](https://loopback.io/doc/en/lb3/Defining-boot-scripts.html)
- `routes`
- `routes:after`
- `files:before`
- `files`
- `files:after`
- `final:before`
- `final`
- `final:after`

Any middleware higher up in the chain may terminate the request by sending a
response back to the client.

![LoopBack 3 request/response components](./imgs/lb3-req-res.png)

The REST API middleware is added in the `routes` phase and error handlers in the
`final` and `final:after` phases.

The REST API middleware is responsible for creating REST API endpoints out of
the models in the app. It then uses the configured datasource for connecting
and querying the undelying database for the corresponding REST requests.

In LoopBack 4, the [sequence](https://loopback.io/doc/en/lb4/Sequence.html) is
the gatekeeper of all requests to the app. Every request to the app must pass
through the sequence. It identifies the responsible handler for the requested
endpoint and passes on the request to the handler.

![LoopBack 4 request/response components](./imgs/lb4-req-res.png)

Unlike LoopBack 3, models in LoopBack 4 do not create REST endpoints. Use the
`lb4 controller` command to quickly generate the REST endpoints for a model.

For more details, refer to the LoopBack 4
[request/response cycle](https://loopback.io/doc/en/lb4/Request-response-cycle.html)
doc.

#### Access to the request/response object

Since LoopBack 3 uses the Express middleware pattern, the request and response
objects can always be accessed in all the middleware functions.

In LoopBack 4, the request and response objects can be accessed in
routers loaded using the
[app.mountExpressRouter() ](https://loopback.io/doc/en/lb4/apidocs.rest.restapplication.mountexpressrouter.html)
method, using the familiar Express middleware signature.

Controllers, services, and repositories are LoopBack 4 components that
participate in the request/response cycle. The request and response objects can
be made available to them via
[dependency injection](https://loopback.io/doc/en/lb4/Dependency-injection.html)
.

Example of accesssing the request and response object in a Controller:

```ts
import {inject} from '@loopback/context';
import {Request, Response, RestBindings, get} from '@loopback/rest';

export class ExampleController {
  constructor(
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @inject(RestBindings.Http.RESPONSE) private res: Response
    ) {}

  @get('/headers')
  headers() {
    // Sends back the request headers
    this.res.send(this.req.headers);
  }
}
```

Similarly, the request and response objects can be injected into services
and respositories along with other objects from the
[context](https://loopback.io/doc/en/lb4/Context.html).

{% include tip.html content="It may be tempting to use an Express router
(because of familiarity) instead of a controller to add custom endpoints to the
app, but bear it in mind that controllers are way more powerful and capable than
Express routers because of their support for dependency injection and access to
the application context." %}

#### Data validation

LoopBack 3 models come with
[validation methods](https://loopback.io/doc/en/lb3/Validating-model-data.html)
. The validation rules are derived from the model definition files or are
applied by calling the validation methods in the model's JavaScript file.

In LoopBack 4, models are defined as classes whose properties decorated with the
[@property()](https://loopback.io/doc/en/lb4/Model.html#property-decorator)
decorator become the model's properties. Request body to an endpoint is
validated against the attributes specified in the `@property()` decorator of the
corresponding model.

Model validation methods like `validatesLengthOf()`,
`validatesLengthOf()`, etc., from LoopBack 3 can be implemented in LoopBack 4
by specifying the `jsonSchema` property in a model's property definition.

Here is an example of enforcing the string length of a model property in
LoopBack 4:

```ts
export class Book extends Entity {
  ...
  @property({
    type: 'string',
    jsonSchema: {
      'minLength': 5,
      'maxLength': 25
    }
  })
  title: string;
  ...
}
```

If the length of `title` is less than 5 characters, or is more than 25
characters a 422 error will be thrown by the server.

{% include tip.html content="Our use of
[ajv](https://www.npmjs.com/package/ajv)
makes the validation process
a lot more powerful in LoopBack 4. Refer to the
[ajv documentation](https://github.com/epoberezkin/ajv#validation-keywords)
for all the possible validations for different data types." %}

In LoopBack 3, the `before save`
[operation hook](https://loopback.io/doc/en/lb3/Operation-hooks.html)
enable users to access the model data before it is written to the
database. A similar functionality can be achieved in LoopBack 4 by overriding
the `create()` method of the
[default CRUD repository](https://loopback.io/doc/en/lb4/apidocs.repository.defaultcrudrepository.html)
in the repository of the model.

Example of accessing model data before saving in LoopBack 3, using the
`before save` operation hook:

```js
Book.observe('before save', async (ctx) => {
  if (!ctx.instance.author) {
    ctx.instance.author = 'Anonymous';
  }
});
```

Example of accessing model data before saving in LoopBack 4, by overriding the
`create()` method of the model's repository.

```ts
async create(book: Book, options?: Options): Promise<Book> {
  if (!book.author) {
    book.author = 'Anonymous';
  }
  return super.create(book, options);
}
```

Similarly, various other repository methods in LoopBack 4 can be overriden to
access the model data in the context of their operation.

{% include tip.html content="
[Interceptors](https://loopback.io/doc/en/lb4/Interceptors.html)
may also be used to access the user submitted data in some cases." %}

## Summary

The phase-based middleware chain of LoopBack 3 is replaced by the sequence class
in LoopBack 4. Controllers, services, and respositories are part of the
request/response cycle in LoopBack 4; they provide interfaces and points of
access to the request object, the response object, and the model data.
