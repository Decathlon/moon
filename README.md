# <img src='images/moon-title.png' height='50' alt='Moon Logo'/>

_**The power of react-query with your favorite HTTP Client**_

**Moon** is a featured, production ready caching **REST** client based on [**react-query**](https://github.com/tannerlinsley/react-query) for every **React UI**. It allows you to manage queries life cycle with an api and easily build React UI components that fetch data via a HTTP client (Axios, fetch... ).
The only thing you have to do is transmit the configuration. **Moon does the rest !** 🚀

Moon client can be used in any React app where you want to use data. It's:

1. **Incrementally adoptable**, so that you can drop it into an existing React app and start using Moon for just part of your UI.
2. **Universally compatible**, so that Moon works with any build setup, any REST server, and any REST schema.
3. **Simple to get started with**, so you can start loading data right away and learn about advanced features later.

## Installation for Axios client

```bash
npm install @decathlon/moon @decathlon/moon-axios react-query axios --save
```

## Usage

You get started by create REST links. A link is an object which need an id and an HTTP client config like the AxiosConfig (that extends the Moon's ClientConfig) of your REST server (for more information about the REST link config please see the **Moon config** section).

To connect Moon to your React app, you will need to use the MoonProvider component exported from `@decathlon/moon`. The MoonProvider is a React's Context.Provider. It wraps your React app and places the client and the store (the query cache of the **react-query**) on the context, which allows you to access it from anywhere in your component tree. You also need to add the HTTP client factory (**clientFactory**). Here we have added the Axios factory to create an axios client for each link. You can also add a client factory for each link. This is useful for using multiple data sources or for mocking data during development phase (tests, mvp...).


```js
import { MoonProvider } from "@decathlon/moon";
import axiosClientFactory from "@decathlon/moon-axios";

const links = [
  {
    id: "FOO",
    config: { baseURL: "http://foo.com" }, // the Client config,
    // clientFactory?: ClientFactory<C, R, I>
  }
];

const App = () => {
  return (
    <MoonProvider links={links} clientFactory={axiosClientFactory}>
      <MyComponent />
    </MoonProvider>
  );
};

```

Once your **MoonProvider** is hooked up, you're ready to start requesting data with the Query component or with  the useQuery hook!

#### Query Component

```js
import { Query } from "@decathlon/moon";

const MyComponent = () => {
  return (
    <Query<QueryVariables, QueryResponse, QueryError>
      id="queryId"
      source="FOO"
      endPoint="/users"
      variables={{ foo: "bar" }}
      fetchPolicy={FetchPolicy.CacheFirst} // please see the fetchPolicy query prop
    >
      {({ isLoading, data, error }) => {
        if (isLoading) return <span> Loading ...</span>;
        return <span>{error ? error.message : "success"}</span>;
      }}
    </Query>
  );
};
```
Congrats 🎉, you just made your first query with the **Query** component! 

#### useQuery hook

The same query with the **useQuery** hook

```js
import { useQuery } from "@decathlon/moon";

const MyComponent = () => {
  const [{ refetch }, { isLoading, error }] = useQuery<QueryVariables, QueryData, QueryError>({
    id: "queryId",
    source: "FOO",
    endPoint: "/users",
    variables: { foo: "bar" },
    fetchPolicy: FetchPolicy.CacheFirst // please see the fetchPolicy query prop
    // options: {...} // the http client config
    // queryConfig: {...} // the react-query config
  });

  if (isLoading) return <span> Loading ...</span>;
  return <span>{error ? error.message : "success"}</span>;
};
```
Internally useQuery use the **react-query**'s useQuery hook connected to your HTTP client with a configuration allowing better cache management (fetch policy) and better referencing (management of query identifiers adapted to the use of HTTP clients, **useQueryState/useQueryResult**...) of requests for REST clients.

#### Mutation / useMutation

Now that we've learned how to fetch data with the Query/useQuery component/hook, the next step is to learn how to mutate that data with mutations. For that we need to use the Mutation/useMutation component/hook.

```js
import { Mutation } from '@decathlon/moon';

const MyComponent = () => {
  return (
    <Mutation<MutationVariables, MutationResponse, MutationError> source="FOO" endPoint="/users" variables={{ foo: "bar" }}>
      {({ data, error, actions: { mutate } }) => {
        const result = data ? <span>{data.status && "Success"}</span> : <div onClick={mutate}>Go</div>;
        return error ? <span>{error.message}</span> : result;
      }}
    </Mutation>
  );
};
```

The same mutation with **useMutation**:

```js
import { useQuery } from '@decathlon/moon';

const MyComponent = () => {
  const variables = React.useMemo(() => ({ foo: "bar" }), [...]);
  const [{ mutate }, {  error, data }] = useMutation<MutationResponse, MutationVariables>({
    source: "FOO",
    endPoint: "/users",
    variables: { foo: "bar" },
    // type: ..., // the mutation type (POST, PUT...)
    // options: {...} // the http client config
    // mutationConfig: {...} // the react-query config
  });

  const result = data ? <span>{data.status && "Success"}</span> : <div onClick={mutate}>Go</div>;
  return error ? <span>{error.message}</span> : result;
};
```
Internally useMutation use the **react-query**'s useMutation connected to your HTTP client.

## Other useful Hooks

Sometimes we need to retrieve the state/result of a query in another component. useQueryResult/useQueriesResult/useQueryState/useQueriesStates allows you to do this. For that, it is enough to give him the id/ids of the query/queries:

### useQueryState

Updated when the query state is changed. The optional **stateToProps** function is used for selecting the part of the data from the query state that the connected component needs. 

```js
import { useQueryState } from '@decathlon/moon';

const MyComponent = () => {
  const stateToProps = (queryState) => queryState // optional
  const { isFetching } = useQueryState("queryId", stateToProps);
  return <span>{isFetching ? "Loading..." : "success"}</span>;
};
```

The first prop is the query id used by the query. If the query is defined without an id then the id generated by default must be used. To generate an identifier, you must use the **getQueryId** utility. The default id is generated from the source, the endPoint, the variables and the options props.

```js
import { useQueryState, getQueryId } from "@decathlon/moon";

const MyComponent = () => {
  const queryId = getQueryId({ source: "FOO", endPoint: "/users", variables: { foo: "bar" } });
  const { isFetching } = useQueryState(queryId);
  return <span>{isFetching ? "Loading..." : "success"}</span>;
};

```

### useQueriesStates

Updated when one of the query states is changed.The optional **statesToProps** function is used for selecting the part of the data from the query state that the connected component needs.

```js
import { useQueriesStates } from '@decathlon/moon';

const MyComponent = () => {
  const statesToProps = (queriesStates) => queriesStates
  const { queryId: { isFetching } } = useQueriesStates(["queryId"], statesToProps);
  return <span>{isFetching ? "Loading..." : "success"}</span>;
};
```

### useQueryResult

Updated only when the query result is changed. .The optional **resultToProps** function is used for selecting the part of the data from the query result that the connected component needs.

```js
import { useQueryResult } from '@decathlon/moon';

const MyComponent = () => {
  const resultToProps = (queryResult) => queryResult
  const result = useQueryResult("queryId", resultToProps);
  return <span>{...result...}</span>;
};
```

### useQueriesResults

Updated only when one of the query results is changed. The optional **statesToProps** function is used for selecting the part of the data from the queries results that the connected component needs.

```js
import { useQueriesResults } from '@decathlon/moon';

const MyComponent = () => {
  const resultsToProps = (queriesResults) => queriesResults
  const { queryId: queryIdResult } = useQueriesResults(["queryId"], statesToProps);
  return <span>{...queryIdResult...}</span>;
};
```
### useMoon

You can use the moon client directly like this:

```js
import { useMoon } from '@decathlon/moon';

const MyComponent = () => {
  const { client, store } = useMoon();
  client.query(...);
  client.mutate(...);
  // the store is the queryCache of the react-query API
};
```

## HOCs

### withMoon

Same as useMoon hook.

```js
import { withMoon } from '@decathlon/moon';

interface Props extends IMoonContextValue {
  prop: string;
}

const MyComponent: React.FunctionComponent<Props>= ({ client, store, prop }) => {
  ...
};

export withMoon<Props>(MyComponent);
```

### withQueryResult

Same as useQueryResult hook.

```js
import { withQueryResult } from '@decathlon/moon';

interface Props {
  queryResult: QueryState<QueryResponse, QueryError>;
}


const MyComponent: React.FunctionComponent<Props> = ({ queryResult }) => {
  ...
};

export default withQueryResult<Props, QueryResponse, /* QueryResultProps */>(queryId, /* resultToProps */)(MyComponent);
```


### withQueriesResults

Same as useQueriesResults hook.
```js
import { withQueriesResults } from '@decathlon/moon';

interface Props {
  queriesResults: {
    queryId: QueryState<QueryResponse, QueryError>;
    queryId2: QueryState<QueryResponse, QueryError>;
  }
}


const MyComponent: React.FunctionComponent<Props> = ({ queriesResults: { queryId, queryId2 } }) => {
  ...
};

export default withQueriesResults<Props, QueryResponse, /* QueryResultProps */>([queryId, queryId2], /* resultToProps */)(MyComponent);
```

## Moon provider props

```js
interface IMoonProviderProps {
  // The links ( HTTP clients config)
  links: ILink[];
  // The global Moon client factory (like the moon-axios Axios client for moon https://github.com/dktunited/moon-axios)
  clientFactory: ClientFactory;
  // The react-query cache object
  store?: QueryCache;
  // The react-query cache config (please see https://react-query.tanstack.com/docs/api/#reactqueryconfigprovider for more details)
  config?: ReactQueryConfig;
  // The react-query initial cache state (please see https://react-query.tanstack.com/docs/api#hydrationdehydrate for more details)
  hydrate?: HydrateProps;
}
```

## Query options

This the Typescript interface of the Query/useQuery component/hook.

```js
export interface IQueryProps<QueryVariables = any, QueryResponse = any, QueryError = any, QueryConfig = any> {
  id?: string;
  /** The Link id of the http client. */
  source: string;
  /** The REST end point. */
  endPoint?: string;
  /** The variables of your query. */
  variables?: QueryVariables;
  /**
   * The fetch policy is an option which allows you to
   * specify how you want your component to interact with
   * the Moon data cache. Default value: FetchPolicy.CacheAndNetwork */
  fetchPolicy?: FetchPolicy;
  /** The http client options of your query. */
  options?: QueryConfig;
  /** The react-query config. Please see the react-query QueryConfig for more details. */
  queryConfig?: ReactQueryConfig<QueryResponse, QueryError>;
}
```

### fetchPolicy

The fetch policy is an option which allows you to specify how you want your component to interact with the Moon data cache. By default your component will try to read from the cache first, and if the full data for your query is in the cache then Moon simply returns the data from the cache. If the full data for your query is not in the cache then Moon will execute your request using your network interface. By changing this option you can change this behavior.

Valid fetchPolicy values are:

- **cache-first:** This value where we always try reading data from your cache first. If all the data needed to fulfill your query is in the cache then that data will be returned. Moon will only fetch from the network if a cached result is not available. This fetch policy aims to minimize the number of network requests sent when rendering your component.
- **cache-and-network:** This is the default value. This fetch policy will have Moon first trying to read data from your cache. If all the data needed to fulfill your query is in the cache then that data will be returned. However, regardless of whether or not the full data is in your cache this fetchPolicy will always execute query with the network interface unlike cache-first which will only execute your query if the query data is not in your cache. This fetch policy optimizes for users getting a quick response while also trying to keep cached data consistent with your server data at the cost of extra network requests.
- **network-only:** This fetch policy will never return you initial data from the cache. Instead it will always make a request using your network interface to the server. This fetch policy optimizes for data consistency with the server, but at the cost of an instant response to the user when one is available.


## Mutation options

This the Typescript interface of the Mutation/useMutation component/hook.

```js
export interface IMutationProps<
  MutationVariables = any,
  MutationResponse = any,
  MutationError = any,
  MutationClientConfig = any
> {
  /** The link id of the http client */
  source: string;
  /** The REST end point */
  endPoint?: string;
  /** The variables of your mutation */
  variables?: MutationVariables;
  /** The mutation method. Default value:  MutateType.Post */
  type?: MutateType;
  /** The http client options of your mutation. */
  options?: MutationClientConfig;
  /** The react-query config. Please see the react-query MutationConfig for more details. */
  mutationConfig?: MutationConfig<MutationResponse, MutationError, MutationVariables, unknown>;
}
```
## Moon config

For each Moon link we can add interceptors (middleware: language, api token, success Handler....) for the request and/or the response like this:

```js
import { AxiosRequestConfig } from "axios";
import axiosClientFactory from "@decathlon/moon-axios";

function successHandler(response: AxiosResponse){...};

function setLanguage(config: AxiosRequestConfig): AxiosRequestConfig | Promise<AxiosRequestConfig> {
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

const links = [
  {
    id: "FOO",
    config: { baseURL: "http://foo.com" },
    interceptors: { request: requestInterceptors, response: responseInterceptors },
    clientFactory: axiosClientFactory
  },
  {
    id: "BAR",
    config: { baseURL: "http://bar.com" }
    clientFactory: yourClientFactory // must extends the Moon ClientInstace
  }
];

```


## Getting Started (Devs)

```bash
git clone ...
cd moon
lerna bootstrap
```

## Running the tests

```bash
lerna run test
```

## Contributing

**PRs are welcome!**
You noticed a bug, a possible improvement or whatever?
Any help is always appreciated, so don't hesitate opening one!

Be sure to check out the [contributing guidelines](CONTRIBUTING.md) to fasten
up the merging process.

## Active authors

* **Amen Souissi**  [amen-souissi](https://github.com/amen-souissi)
* **Benjamin Wintrebert** [Ben-Wintrebert](https://github.com/Ben-Wintrebert)
* **Hyacinthe Knobloch** [hyacintheknobloch](https://github.com/hyacintheknobloch)

See also the list of [contributors](https://github.com/Decathlon/moon/graphs/contributors) who participated in this project.

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE.md](https://github.com/Decathlon/moon/blob/master/LICENSE) file for details
