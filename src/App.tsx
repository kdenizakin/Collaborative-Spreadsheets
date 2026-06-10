import "./App.css";
import "/node_modules/primeflex/primeflex.css";
import "primeicons/primeicons.css";
import * as Y from "yjs";
import SpreadSheet from "./components/SpreadSheet.tsx";
import { WebsocketProvider } from "y-websocket";
import { useState } from "react";

//-----------------------------Yjs Structures-----------------------------
const yDoc = new Y.Doc();
const yMap = yDoc.getMap("spreadsheet");
const yColumns: Y.Array<unknown> = yDoc.getArray("columns");
const yRows = yDoc.getArray("rows");
const undoColumns = new Y.UndoManager(yColumns);
const undoRows = new Y.UndoManager(yRows);
const yColKeep = yDoc.getMap("column-keep");
const yRowKeep = yDoc.getMap("row-keep");
//------------------------------------------------------------------------

const wsProvider = new WebsocketProvider(
  "ws://localhost:1244",
  "my-roomname",
  yDoc,
);

function App() {
  let [isConnected, setIsConnected] = useState<boolean>(false);

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

  wsProvider.on(
    "status",
    (event: { status: "connected" | "disconnected" | "connecting" }) => {
      console.log(event.status);
      if (event.status === "connected") setIsConnected(true);
    },
  );

  return (
    <>
      <SpreadSheet
        className="spreadsheet"
        isConnected={isConnected}
        setIsConnected={setIsConnected}
        closeWsConnection={closeWsConnection}
        reopenWsConnection={reopenWsConnection}
        yDoc={yDoc}
        yMap={yMap}
        yColumns={yColumns}
        yRows={yRows}
        yColKeep={yColKeep}
        yRowKeep={yRowKeep}
      />
    </>
  );
}

export default App;
