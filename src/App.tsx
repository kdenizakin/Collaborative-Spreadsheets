import "./App.css";
import "/node_modules/primeflex/primeflex.css";
import "primeicons/primeicons.css";
import * as Y from "yjs";
import SpreadSheet from "./components/SpreadSheet.tsx";
import { WebsocketProvider } from "y-websocket";

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
  "ws://localhost:1234",
  "my-roomname",
  yDoc,
);

function App() {
  wsProvider.on(
    "status",
    (event: { status: "connected" | "disconnected" | "connecting" }) => {
      console.log(event.status);
    },
  );

  return (
    <>
      <SpreadSheet
        className="spreadsheet"
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
