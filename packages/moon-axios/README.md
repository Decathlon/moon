# @pricemoov-oss/moon-axios

_**The power of react-query with Axios**_

**@pricemoov-oss/moon** is the [Axios](https://github.com/axios/axios) HTTP client for [Moon](https://github.com/PricemoovOSS/moon). 

## Installation

```bash
npm install @pricemoov-oss/moon @pricemoov-oss/moon-axios react-query axios --save
```

## Usage

Please see the [Moon doc](https://github.com/PricemoovOSS/moon/blob/master/README.md) for more details.

```js
import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { MoonProvider, ILink } from "@pricemoov-oss/moon";
import axiosClientFactory from "@pricemoov-oss/moon-axios";

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


const links: ILink<AxiosInstance, AxiosRequestConfig, AxiosResponse>[] = [
  {
    id: "FOO",
    config: { baseURL: "http://foo.com" }, // AxiosRequestConfig
    interceptors: { request: requestInterceptors, response: responseInterceptors }
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

Once your **MoonProvider** is hooked up, you're ready to start requesting !
