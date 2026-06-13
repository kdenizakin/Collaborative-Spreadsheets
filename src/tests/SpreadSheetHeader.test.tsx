import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SpreadSheetHeader from "../components/SpreadSheetHeader";
import { userEvent } from "@testing-library/user-event";
import { vi } from "vitest";

test("renders add row and add column buttons", () => {
  render(
    <SpreadSheetHeader
      addRow={vi.fn()}
      addColumn={vi.fn()}
      yRows={[]}
      yColumns={{ length: 0, get: vi.fn() }}
      generateRandomUid={vi.fn()}
    />,
  );

  expect(screen.getByTestId("add-row-button")).toBeInTheDocument();
  expect(screen.getByTestId("add-column-button")).toBeInTheDocument();
});

test("calls addRow with last row and append=true", async () => {
  const addRow = vi.fn();
  const addColumn = vi.fn();
  const generateRandomUid = vi.fn(() => "mock-row-uid");
  const user = userEvent.setup();

  const yRows = [{ id: "row-1" }, { id: "row-2" }];
  const yColumns = { length: 0, get: vi.fn() };

  render(
    <SpreadSheetHeader
      addRow={addRow}
      addColumn={addColumn}
      generateRandomUid={generateRandomUid}
      yRows={yRows}
      yColumns={yColumns}
    />,
  );

  await user.click(screen.getByTestId("add-row-button"));

  expect(generateRandomUid).toHaveBeenCalledTimes(1);
  expect(addRow).toHaveBeenCalledTimes(1);
  expect(addRow).toHaveBeenCalledWith("mock-row-uid", yRows[1], true);
});

test("calls addColumn with last column and append=true", async () => {
  const addRow = vi.fn();
  const addColumn = vi.fn();
  const generateRandomUid = vi.fn(() => "mock-col-uid");
  const user = userEvent.setup();

  const lastColumn = { id: "col-2" };
  const yColumns = {
    length: 2,
    get: vi.fn((idx: number) => (idx === 1 ? lastColumn : { id: "col-1" })),
  };

  render(
    <SpreadSheetHeader
      addRow={addRow}
      addColumn={addColumn}
      generateRandomUid={generateRandomUid}
      yRows={[]}
      yColumns={yColumns}
    />,
  );

  await user.click(screen.getByTestId("add-column-button"));

  expect(generateRandomUid).toHaveBeenCalledTimes(1);
  expect(addColumn).toHaveBeenCalledTimes(1);
  expect(addColumn).toHaveBeenCalledWith("mock-col-uid", lastColumn, true);
});
