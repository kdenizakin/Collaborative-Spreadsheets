import "./App.css";
import "/node_modules/primeflex/primeflex.css";
import "primeicons/primeicons.css";
import * as Y from "yjs";
import SpreadSheet from "./components/SpreadSheet.tsx";
import { WebsocketProvider } from "y-websocket";
import { useEffect, useState } from "react";
import { useYDocStore, useYMapStore } from "./YjsStore.ts";
import { setSelection } from "@testing-library/user-event/dist/cjs/event/selection/setSelection.js";

function App() {
  let [isConnected, setIsConnected] = useState<boolean>(false);
  const yDoc = useYDocStore.getState().YDoc;

  const [wsProvider, setWsProvider] = useState<WebsocketProvider | null>(null);

  useEffect(() => {
    const wsProvider = new WebsocketProvider(
      "ws://localhost:1236",
      "my-roomname",
      yDoc,
    );
    setWsProvider(wsProvider);

    const handleStatus = (event: {
      status: "connected" | "disconnected" | "connecting";
    }) => {
      console.log(event.status);
      setIsConnected(event.status === "connected");
    };

    wsProvider.on("status", handleStatus);

    return () => {
      wsProvider.off("status", handleStatus);
      wsProvider.destroy();
    };
  }, [yDoc]);

  const closeWsConnection = () => {
    wsProvider.disconnect();
    console.log("connection closed");
    setIsConnected(false);
  };

  const reopenWsConnection = () => {
    wsProvider.connect();
    if (wsProvider.synced) {
      console.log("connection established again");
      setIsConnected(true);
    }
  };

  return (
    <>
      <SpreadSheet
        className="spreadsheet"
        isConnected={isConnected}
        setIsConnected={setIsConnected}
        closeWsConnection={closeWsConnection}
        reopenWsConnection={reopenWsConnection}
        yDoc={yDoc}
      />
    </>
  );
}

export default App;
