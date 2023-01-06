import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import { createServer } from "http";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { PubSub, withFilter } from "graphql-subscriptions";
import bodyParser from "body-parser";
import cors from "cors";

const PORT = 4000;
const pubsub = new PubSub();
let currentNumber = 0;

// Schema definition
const typeDefs = `#graphql
  type Query {
    currentNumber: Int
  }

  type Subscription {
    numberIncremented(fromNumber: Int!): Int
  }

  type Mutation {
    increaseCurrentNumber: Int
  }
`;

// Resolver map
const resolvers = {
  Query: {
    currentNumber() {
      return currentNumber;
    },
  },
  Mutation: {
    increaseCurrentNumber() {
      currentNumber++;
      pubsub.publish("NUMBER_INCREMENTED", {
        numberIncremented: currentNumber,
      });
      return currentNumber;
    },
  },
  Subscription: {
    numberIncremented: {
      resolve: (payload, args, context, info) => {
        console.log("Resolving...", payload, args);
        return -payload.numberIncremented;
      },
      subscribe: withFilter(
        () => pubsub.asyncIterator(["NUMBER_INCREMENTED"]),
        (payload, variables) => {
          console.log("Filtering...", payload, variables);
          return payload.numberIncremented > variables.fromNumber;
        }
      ),
    },
  },
};

// Create schema, which will be used separately by ApolloServer and
// the WebSocket server.
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Create an Express app and HTTP server; we will attach the WebSocket
// server and the ApolloServer to this HTTP server.
const app = express();
const httpServer = createServer(app);

// Set up WebSocket server.
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});
const serverCleanup = useServer({ schema }, wsServer);

// Set up ApolloServer.
const server = new ApolloServer({
  schema,
  plugins: [
    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),

    // Proper shutdown for the WebSocket server.
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

await server.start();
app.use(
  "/graphql",
  cors<cors.CorsRequest>(),
  bodyParser.json(),
  expressMiddleware(server)
);

// Now that our HTTP server is fully set up, actually listen.
httpServer.listen(PORT, () => {
  console.log(`🚀 Query endpoint ready at http://localhost:${PORT}/graphql`);
  console.log(
    `🚀 Subscription endpoint ready at ws://localhost:${PORT}/graphql`
  );
});

// function incrementNumber() {
//   currentNumber++;
//   pubsub.publish('NUMBER_INCREMENTED', { numberIncremented: currentNumber });
//   setTimeout(incrementNumber, 1000);
// }

// // Start incrementing
// incrementNumber();
