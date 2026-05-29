import { useState, useRef } from "react";

import "./App.css";
import "/node_modules/primeflex/primeflex.css";
import "primeicons/primeicons.css";

import { PrimeReactProvider, PrimeReactContext } from "primereact/api";
import SpreadSheet from "./components/SpreadSheet.tsx";

function App() {
  return (
    <>
      <SpreadSheet className="spreadsheet" />
    </>
  );
}

export default App;
