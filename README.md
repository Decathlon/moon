# <img src='images/moon-title.png' height='50' alt='Moon Logo'/>

**Moon** is a featured, production ready caching **REST** client for every **React UI**. It allows you to manage queries life cycle with an api and easily build React UI components that fetch data via Axios.
The only thing you have to do is transmit the configuration. **Moon does the rest !** 🚀

Moon client can be used in any React app where you want to use data. It's:

1. **Incrementally adoptable**, so that you can drop it into an existing React app and start using Moon for just part of your UI.
2. **Universally compatible**, so that Moon works with any build setup, any REST server, and any REST schema.
3. **Simple to get started with**, so you can start loading data right away and learn about advanced features later.

## Installation

```bash
npm install @decathlon/moon --save
```

## Usage

You get started by create REST links. A link is an object which need an id and a baseURL of your REST server (for more information about the REST link config please see the **Moon config** section).

To connect Moon to your React app, you will need to use the MoonProvider component exported from `@decathlon/moon`. The MoonProvider is a React's Context.Provider. It wraps your React app and places the client on the context, which allows you to access it from anywhere in your component tree.

```js
import { MoonProvider } from "@decathlon/moon";

const links = [
  {
    id: "FOO",
    baseURL: "http://foo.com"
  }
];

const App = () => {
  return (
    <MoonProvider links={links}>
      <MyComponent />
    </MoonProvider>
  );
};

```

Once your **MoonProvider** is hooked up, you're ready to start requesting data with the Query component or with  the useQuery hook!

#### Query Component

```js
import { Query } from '@decathlon/moon';

const MyComponent = () => {
  return (
    <Query<QueryData, QueryVariables> source="FOO" endPoint="/users" variables={{ foo: "bar" }}>
      {({ loading, data, error }) => {
        if (loading) return <span> Loading ...</span>;
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
import { useQuery } from '@decathlon/moon';

const MyComponent = () => {
  const variables = React.useMemo(() => ({ foo: "bar" }), [...]);
  const [{ loading, error }, { refetch }] = useQuery<QueryData, QueryVariables>({ source: "FOO", endPoint: "/users", variables });

  if (loading) return <span> Loading ...</span>;
  return <span>{error ? error.message : "success"}</span>;
};
```

#### Mutation / useMutation

Now that we've learned how to fetch data with the Query/useQuery component/hook, the next step is to learn how to mutate that data with mutations. For that we need to use the Mutation/useMutation component/hook.

```js
import { Mutation } from '@decathlon/moon';

const MyComponent = () => {
  return (
    <Mutation<MutationResponse, MutationVariables> source="FOO" endPoint="/users" variables={{ foo: "bar" }}>
      {({ response, error, actions: { mutate } }) => {
        const result = response ? <span>{response.status && "Success"}</span> : <div onClick={mutate}>Go</div>;
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
  const [{ loading, error, response }, { mutate }] = useMutation<MutationResponse, MutationVariables>({
    source: "FOO",
    endPoint: "/users",
    variables
  });

  const result = response ? <span>{response.status && "Success"}</span> : <div onClick={mutate}>Go</div>;
  return error ? <span>{error.message}</span> : result;
};
```

## Other Hooks

Sometimes we need to retrieve the state/result of a query in another component. useQueryResult/useQueriesResult/useQueryState/useQueriesStates allows you to do this. For that, it is enough to give him the id/ids of the query/queries:

### useQueryState

Updated when the query state is changed. The optional **stateToProps** function is used for selecting the part of the data from the query state that the connected component needs.

```js
import { useQueryState } from '@decathlon/moon';

const MyComponent = () => {
  const stateToProps = (queryState) => queryState
  const { loading } = useQueryState("queryId", stateToProps);
  return <span>{loading ? "Loading..." : "success"}</span>;
};
```
### useQueriesStates

Updated when one of the query states is changed.The optional **statesToProps** function is used for selecting the part of the data from the query state that the connected component needs.

```js
import { useQueriesStates } from '@decathlon/moon';

const MyComponent = () => {
  const statesToProps = (queriesStates) => queriesStates
  const { queryId: { loading } } = useQueriesStates(["queryId"], statesToProps);
  return <span>{loading ? "Loading..." : "success"}</span>;
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
  store.readQuery(...);
  store.writeQuery(...);
};
```

## HOCs

### withMoon

Same as useMoon hook.

```js
import { withMoon } from '@decathlon/moon';

const MyComponent = ({ client, store }) => {
  ...
};

export withMoon(MyComponent);
```

### withQueryResult

Same as useQueryResult hook.

```js
import { withQueryResult } from '@decathlon/moon';

const MyComponent = ({ queryId }) => {
  ...
};

export withQueryResult(queryId, resultToProps)(MyComponent);
```


### withQueriesResults

Same as useQueriesResults hook.
```js
import { withQueriesResults } from '@decathlon/moon';

const MyComponent = ({ queryId, queryId2 }) => {
  ...
};

export withQueriesResults([queryId, queryId2], resultsToProps)(MyComponent);
```

## Query options

This the Typescript interface of the Query/useQuery component/hook.

```js
interface IQueryProps<QueryData = any, QueryVariables = any, DeserializedData = QueryData> {
  id?: string;
  source: string;
  endPoint: string;
  variables?: QueryVariables;
  fetchOnMount?: boolean;
  autoRefetchOnUpdate?: boolean;
  fetchPolicy?: FetchPolicy;
  options?: AxiosRequestConfig;
  deserialize?: (response: QueryData) => DeserializedData;
  onResponse?: (response: DeserializedData) => void;
  onError?: (error: any) => void;
  children?: (props: IChildren<DeserializedData>) => Nullable<JSX.Element | JSX.Element[]>;
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
export interface IMutationProps<MutationResponse = any, MutationVariables = any> {
  source: string;
  endPoint: string;
  variables?: MutationVariables;
  type?: MutateType;
  children?: (props: IChildren<MutationResponse>) => React.ReactNode;
  onResponse?: (response: MutationResponse) => void;
  onError?: (error: any) => void;
}

```
## Moon config

For each Moon link we can add interceptors (middleware: language, api token, success Handler....) for the request and/or the response like this:

```js
import { AxiosRequestConfig } from "axios";

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
    baseURL: "http://foo.com",
    interceptors: { request: requestInterceptors, response: responseInterceptors }
  },
  {
    id: "BAR",
    baseURL: "http://bar.com"
  }
];

```


## Getting Started (Devs)

```bash
git clone ...
cd moon
npm ci
```

## Running the tests

```bash
npm run test
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
