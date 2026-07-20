import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import Cell from "../components/Cell";
import { useYMapStore } from "../YjsStore";

function createMockYMap(initialData: Record<string, any> = {}) {
  const store = new Map(Object.entries(initialData));
  let observer: any = null;

  return {
    get: vi.fn((key: string) => store.get(key)),
    set: vi.fn((key: string, value: any) => {
      const action = store.has(key) ? "update" : "add";
      const oldValue = store.get(key);
      store.set(key, value);

      if (observer) {
        observer({
          changes: {
            keys: new Map([[key, { action, oldValue }]]),
          },
        });
      }
    }),
    observe: vi.fn((cb: any) => {
      observer = cb;
    }),
  };
}

describe("Cell", () => {
  const row = { id: "r1", positionIndex: 0 };
  const col = { id: "c1", positionIndex: 0 };
  const cellId = "c1,r1";
  const yMap = useYMapStore.getState().yMap;

  test("renders initial content from yMap", () => {
    yMap.set(cellId, [
      {
        id: cellId,
        content: "hello",
      },
    ]);

    render(
      <Cell
        key={`${col.id},${row.id}`}
        row={row}
        col={col}
        handleFormula={vi.fn()}
      />,
    );

    expect(screen.getByTestId("cell-input")).toHaveValue("hello");
  });

  test("updates displayed content when observed yMap changes", () => {
    yMap.set(cellId, [
      {
        id: cellId,
        content: "old",
      },
    ]);

    render(
      <Cell
        key={`${col.id},${row.id}`}
        row={row}
        col={col}
        handleFormula={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByTestId("cell-input"), {
      target: { value: "updated" },
    });

    expect(screen.getByTestId("cell-input")).toHaveValue("updated");
  });
});
