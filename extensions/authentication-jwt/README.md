# @loopback/extension-authentication-jwt

This module exports the jwt authentication strategy and its corresponding token
and user service as a component. You can mount the component to get a prototype
token based authentication system in your LoopBack 4 application.

## Usage

To use this component, you need to have an existing LoopBack 4 application and a
datasource in it for persistency.

- create app: run `lb4 app`
- create datasource: run `lb4 datasource`

Next enable the jwt authentication system in your application:

- add authenticate action

<details>
<summary><strong>Check The Code</strong></summary>
<p>

```ts
import {
  AuthenticateFn,
  AuthenticationBindings,
  AUTHENTICATION_STRATEGY_NOT_FOUND,
  USER_PROFILE_NOT_FOUND,
} from '@loopback/authentication';
export class MySequence implements SequenceHandler {
  constructor(
    // - enable jwt auth -
    // inject the auth action
    @inject(AuthenticationBindings.AUTH_ACTION)
    protected authenticateRequest: AuthenticateFn,
  ) {}

  async handle(context: RequestContext) {
    try {
      const {request, response} = context;
      const route = this.findRoute(request);
      // - enable jwt auth -
      // call authentication action
      await this.authenticateRequest(request);

      const args = await this.parseParams(request, route);
      const result = await this.invoke(route, args);
      this.send(response, result);
    } catch (error) {
      // - enable jwt auth -
      // improve the error check
      if (
        error.code === AUTHENTICATION_STRATEGY_NOT_FOUND ||
        error.code === USER_PROFILE_NOT_FOUND
      ) {
        Object.assign(error, {statusCode: 401 /* Unauthorized */});
      }
      this.reject(context, error);
    }
  }
}
```

</p>
</details>

- mount jwt component in application

<details>
<summary><strong>Check The Code</strong></summary>
<p>

```ts
export class TestApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // - enable jwt auth -
    // Add security spec (To be done: refactor it to an enhancer)
    this.addSecuritySpec();
    // Mount authentication system
    this.component(AuthenticationComponent);
    // Mount jwt component
    this.component(JWTAuthenticationComponent);
    // Bind datasource
    this.dataSource(DbDataSource, UserServiceBindings.DATASOURCE_NAME);

    this.component(RestExplorerComponent);
    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {};
  }

  // - enable jwt auth -
  // Currently there is an extra function to
  // merge the security spec into the application.
  // This will be improved with a coming enhancer.
  // See section [To Be Done](#to-be-done)
  addSecuritySpec(): void {
    this.api({
      openapi: '3.0.0',
      info: {
        title: 'test application',
        version: '1.0.0',
      },
      paths: {},
      components: {securitySchemes: SECURITY_SCHEME_SPEC},
      security: [
        {
          // secure all endpoints with 'jwt'
          jwt: [],
        },
      ],
      servers: [{url: '/'}],
    });
  }
}
```

</p>
</details>

_All the jwt authentication related code are marked with comment "- enable jwt
auth -", you can search for it to find all the related code you need to enable
the entire jwt authentication in a LoopBack 4 application._

## Add Endpoint in Controller

After mounting the component, you can call token and user services to perform
login then decorate endpoints with `@authentication('jwt')` to inject the logged
in user's profile.

This module contains an example LoopBack 4 application in folder `fixtures`. It
has a controller with endpoints `/login` and `/whoAmI` for demo's purpose.

The code snippet for login function:

<details>
<summary><strong>Check The Code</strong></summary>
<p>

```ts
async login(
    @requestBody(CredentialsRequestBody) credentials: Credentials,
  ): Promise<{token: string}> {
    // ensure the user exists, and the password is correct
    const user = await this.userService.verifyCredentials(credentials);

    // convert a User object into a UserProfile object (reduced set of properties)
    const userProfile = this.userService.convertToUserProfile(user);

    // create a JSON Web Token based on the user profile
    const token = await this.jwtService.generateToken(userProfile);

    return {token};
  }
```

</p>
</details>

The code snippet for whoAmI function:

<details>
<summary><strong>Check The Code</strong></summary>
<p>
```ts
@authenticate('jwt')
  async whoAmI(): Promise<string> {
    return this.user[securityId];
  }
```
</p>
</details>

The complete file is in
[user.controller.ts](https://github.com/strongloop/loopback-next/tree/master/extensions/authentication-jwt/src/__tests__/fixtures/controllers/user.controller.ts)

## To Be Done

The security specification is currently manually added in the application file.
The next step is to create an enhancer in the component to automatically bind
the spec when app starts.

## Contributions

- [Guidelines](https://github.com/strongloop/loopback-next/blob/master/docs/CONTRIBUTING.md)
- [Join the team](https://github.com/strongloop/loopback-next/issues/110)

## Tests

Run `npm test` from the root folder.

## Contributors

See
[all contributors](https://github.com/strongloop/loopback-next/graphs/contributors).

## License

MIT
