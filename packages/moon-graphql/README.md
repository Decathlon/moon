# @decathlon/moon-graphql

_**The power of react-query with graphql**_

**@decathlon/moon** is the [graphql](https://github.com/prisma-labs/graphql-request) HTTP client for [Moon](https://github.com/Decathlon/moon). 

## Installation

```bash
npm install @decathlon/moon @decathlon/moon-graphql react-query graphql graphql-request --save
```

## Usage

Please see the [Moon doc](https://github.com/Decathlon/moon/blob/master/README.md) for more details.

```js
import { MoonProvider, ILink } from "@decathlon/moon";
import graphqlClientFactory from "@decathlon/moon-graphql";

function successHandler(response){...};

function setLanguage(config: RequestInit): RequestInit {
  return {
    ...config,
    headers: {
      ...config.headers,
      "Accept-Language": "en"
    }
  };
}

const requestInterceptors = [{ onFulfilled: setLanguage }];

const responseInterceptors = [{ onFulfilled: successHandler }];


const links: ILink<GraphqlInstance, GraphqlRequestConfig, GraphqlResponse>[] = [
  {
    id: "FOO",
    config: { baseURL: "http://foo.com" }, // RequestInit
    interceptors: { request: requestInterceptors, response: responseInterceptors }
  }
];

const App = () => {
  return (
    <MoonProvider links={links} clientFactory={graphqlClientFactory}>
      <MyComponent />
    </MoonProvider>
  );
};

```

Once your **MoonProvider** is hooked up, you're ready to start requesting !
