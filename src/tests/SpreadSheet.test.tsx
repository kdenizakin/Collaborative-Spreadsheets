// SpreadSheet.test.tsx
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as Y from "yjs";
import SpreadSheet from "../components/SpreadSheet";

function createYStructures() {
  const yDoc = new Y.Doc();
  const yMap = yDoc.getMap("spreadsheet");
  const yColumns = yDoc.getArray("columns");
  const yRows = yDoc.getArray("rows");
  const undoColumns = new Y.UndoManager(yColumns);
  const undoRows = new Y.UndoManager(yRows);
  const yColKeep = yDoc.getMap("column-keep");
  const yRowKeep = yDoc.getMap("row-keep");

  return {
    yDoc,
    yMap,
    yColumns,
    yRows,
    undoColumns,
    undoRows,
    yColKeep,
    yRowKeep,
  };
}

test("should render the spreadsheet header buttons", () => {
  const yStructures = createYStructures();

  render(<SpreadSheet {...yStructures} />);

  expect(screen.getByTestId("add-row-button")).toBeInTheDocument();
  expect(screen.getByTestId("add-column-button")).toBeInTheDocument();
});
