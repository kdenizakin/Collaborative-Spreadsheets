import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import { describe, test, expect, beforeEach, vi } from "vitest";
import * as Y from "yjs";
import SpreadSheet from "../components/SpreadSheet";

vi.mock("../components/Cell.tsx", () => ({
  default: ({ row, col }: any) => (
    <div data-testid={`mock-cell-${col.id},${row.id}`}>
      Cell: {col.id}-{row.id}
    </div>
  ),
}));

vi.mock("../components/ColumnHeader.tsx", () => ({
  default: ({ columnId }: any) => (
    <div data-testid={`mock-col-header-${columnId}`}>{columnId}</div>
  ),
}));

function generateRandomUid(id: number): string {
  return `id-${id++}`;
}

let idCounter = 1;
vi.mock("../components/SpreadSheetHeader.tsx", () => ({
  default: ({ addColumn, addRow }: any) => (
    <div data-testid="mock-header">
      <button
        onClick={() => addColumn(generateRandomUid(idCounter), undefined, true)}
      >
        Add Col Appended
      </button>
      <button
        onClick={() => addRow(generateRandomUid(idCounter), undefined, true)}
      >
        Add Row Appended
      </button>
    </div>
  ),
}));

describe("SpreadSheet Tests", () => {
  let doc: Y.Doc;
  let yMap: Y.Map<any>;
  let yColumns: Y.Array<string>;
  let yRows: Y.Array<string>;
  let yColKeep: Y.Map<any>;
  let yRowKeep: Y.Map<any>;
  let undoManager: Y.UndoManager;

  beforeEach(() => {
    idCounter = 1;
    doc = new Y.Doc();
    yMap = doc.getMap("cells");
    yColumns = doc.getArray("columns");
    yRows = doc.getArray("rows");
    yColKeep = doc.getMap("colKeep");
    yRowKeep = doc.getMap("rowKeep");
    undoManager = new Y.UndoManager([yColumns, yRows]);
  });

  const renderComponent = () =>
    render(
      <SpreadSheet
        yDoc={doc}
        yMap={yMap}
        yColumns={yColumns}
        yRows={yRows}
        undoColumns={undoManager}
        undoRows={undoManager}
        yColKeep={yColKeep}
        yRowKeep={yRowKeep}
        isConnected={true}
        setIsConnected={vi.fn()}
      />,
    );

  test("1. Renders empty sheet", () => {
    renderComponent();
    expect(screen.getByTestId("mock-header")).toBeInTheDocument();
    expect(screen.queryByTestId(/mock-cell/)).not.toBeInTheDocument();
  });

  test("2. Loads Yjs data into the grid", async () => {
    renderComponent();

    act(() => {
      yColumns.insert(0, ["c1", "c2"]);
      yRows.insert(0, ["r1", "r2"]);
    });

    await waitFor(() => {
      expect(screen.getByTestId("mock-col-header-c1")).toBeInTheDocument();
      expect(screen.getByTestId("mock-col-header-c2")).toBeInTheDocument();
      // 2x2 = 4 cells
      expect(screen.getByTestId("mock-cell-c1,r1")).toBeInTheDocument();
      expect(screen.getByTestId("mock-cell-c2,r2")).toBeInTheDocument();
    });
  });

  test("3. Adds a new column and updates Yjs", async () => {
    renderComponent();

    act(() => {
      yRows.insert(0, ["r1"]);
      fireEvent.click(screen.getByText("Add Col Appended"));
    });

    await waitFor(() => {
      expect(yColumns.length).toBe(1);
      expect(yColumns.get(0)).toBe("id-1");

      expect(screen.getByTestId("mock-col-header-id-1")).toBeInTheDocument();

      expect(yMap.has("id-1,r1")).toBe(true);
      expect(yMap.get("id-1,r1")).toBe("");
    });
  });

  test("4. Adds a new row and updates Yjs", async () => {
    renderComponent();

    act(() => {
      yColumns.insert(0, ["c1"]);
      fireEvent.click(screen.getByText("Add Row Appended"));
    });

    await waitFor(() => {
      expect(yRows.length).toBe(1);
      expect(yRows.get(0)).toBe("id-1");
      expect(screen.getByTestId("mock-cell-c1,id-1")).toBeInTheDocument();
      expect(yMap.has("c1,id-1")).toBe(true);
    });
  });

  test("5. Removes a row", async () => {
    renderComponent();

    act(() => {
      yColumns.insert(0, ["c1"]);
      yRows.insert(0, ["r1", "r2"]);
    });

    await waitFor(() => {
      expect(screen.getByTestId("mock-cell-c1,r1")).toBeInTheDocument();
      expect(screen.getByTestId("mock-cell-c1,r2")).toBeInTheDocument();
    });

    const removeButtons = document.querySelectorAll(".remove-button");
    expect(removeButtons.length).toBe(2);

    act(() => {
      fireEvent.click(removeButtons[0]);
    });

    await waitFor(() => {
      expect(yRows.length).toBe(1);
      expect(yRows.get(0)).toBe("r2");

      expect(yMap.has("c1,r1")).toBe(false);

      expect(screen.queryByTestId("mock-cell-c1,r1")).not.toBeInTheDocument();
      expect(screen.getByTestId("mock-cell-c1,r2")).toBeInTheDocument();
    });
  });

  test("6. Reacts dynamically to external Yjs updates", async () => {
    renderComponent();

    act(() => {
      yColumns.insert(0, ["ext-col"]);
      yRows.insert(0, ["ext-row"]);
    });

    await waitFor(() => {
      expect(screen.getByTestId("mock-col-header-ext-col")).toBeInTheDocument();
      expect(
        screen.getByTestId("mock-cell-ext-col,ext-row"),
      ).toBeInTheDocument();
    });
  });
});
