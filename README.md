# Subscriptions in Apollo Server v4

This example demonstrates a basic subscription operation in Apollo Server. [See the docs on subscriptions](https://www.apollographql.com/docs/apollo-server/data/subscriptions/)

The example server exposes one subscription (`numberIncremented`).
Subscription accepts fromNumber argument which is used to filter subscription results.

Number starts at 0 and is incremented using mutation:

```graphql
mutation {
  increaseCurrentNumber
}
```

After you start up this server, you can test out running a subscription with the Apollo Studio Explorer by following the link from http://localhost:4000/graphql to the Apollo Sandbox. You might need to edit the Apollo Sandbox connection settings to select the [`graphql-ws` subscriptions implementation](https://www.apollographql.com/docs/studio/explorer/additional-features/#subscription-support).

```graphql
subscription IncrementingNumber {
  numberIncremented
}
```

## Run locally

```shell
npm install
npm start
```

## Run in CodeSandbox

<a href="https://codesandbox.io/s/github/apollographql/docs-examples/tree/main/apollo-server/v4/subscriptions-graphql-ws?fontsize=14&hidenavigation=1&initialpath=%2Fgraphql&theme=dark">
  <img alt="Edit" src="https://codesandbox.io/static/img/play-codesandbox.svg">
</a>
