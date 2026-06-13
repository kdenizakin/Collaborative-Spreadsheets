import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import Cell from "../components/Cell";

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

  test("renders initial content from yMap", () => {
    const yMap = createMockYMap({
      [cellId]: "hello",
    });

    render(
      <Cell
        row={row}
        col={col}
        yDoc={{ clientID: 7 }}
        yMap={yMap}
        yColumns={{}}
        yRows={{}}
        undoColumns={{}}
        undoRows={{}}
        yColKeep={{ get: vi.fn(), set: vi.fn() }}
        yRowKeep={{ set: vi.fn() }}
      />,
    );

    expect(screen.getByTestId("cell-input")).toHaveValue("hello");
  });

  test("writes updated value to yMap on input change", () => {
    const yMap = createMockYMap({
      [cellId]: "hello",
    });
    const yColKeep = { get: vi.fn(), set: vi.fn() };
    const yRowKeep = { set: vi.fn() };

    render(
      <Cell
        row={row}
        col={col}
        yDoc={{ clientID: 7 }}
        yMap={yMap}
        yColumns={{}}
        yRows={{}}
        undoColumns={{}}
        undoRows={{}}
        yColKeep={yColKeep}
        yRowKeep={yRowKeep}
      />,
    );

    const input = screen.getByTestId("cell-input");

    fireEvent.change(input, {
      target: { value: "new value" },
    });

    fireEvent.blur(input);

    expect(yMap.set).toHaveBeenCalledWith(cellId, "new value");
    expect(yColKeep.set).toHaveBeenCalledWith("c1", ["c7.1"]);
    expect(yRowKeep.set).toHaveBeenCalledWith("r1", ["c7.1"]);
  });

  test("updates displayed content when observed yMap changes", () => {
    const yMap = createMockYMap({ [cellId]: "old" });

    render(
      <Cell
        row={row}
        col={col}
        yDoc={{ clientID: 7 }}
        yMap={yMap}
        yColumns={{}}
        yRows={{}}
        undoColumns={{}}
        undoRows={{}}
        yColKeep={{ get: vi.fn(), set: vi.fn() }}
        yRowKeep={{ set: vi.fn() }}
      />,
    );

    fireEvent.change(screen.getByTestId("cell-input"), {
      target: { value: "updated" },
    });

    expect(screen.getByTestId("cell-input")).toHaveValue("updated");
  });
});
