import { useEffect, useState } from "react";
import InputField from "./InputField";
import {
  useYDocStore,
  useYMapStore,
  useYColumnsStore,
  useYRowsStore,
  useYColKeepStore,
  useYRowKeepStore,
  useYAllFormulaCellsStore,
} from "../YjsStore";
import { Formula } from "../Formula.ts";

type RemoveKeepOperationId = `c${number}.${number}`;

//this array will be responsible from the update-wins semantics of the cell.
//Foe example, when two concurrent updates are made for the same cell, this array will store both updates and display content accordingly.
//If there are update and delete operations done concurrently, then update operations will win.
type CellType = {
  id: string | number;
  content: string;
  formula?: string;
  formulaReferenceCellIds?: string[];
};

function Cell(props: any) {
  const { row, col, getColumnLabel } = props;

  //-----------------------------Yjs States-----------------------------
  const YDoc = useYDocStore.getState().YDoc;
  const yMap = useYMapStore.getState().yMap;
  const yColKeep = useYColKeepStore.getState().yColKeep;
  const yRowKeep = useYRowKeepStore.getState().yRowKeep;
  const yAllFormulaCells = useYAllFormulaCellsStore.getState().allFormulaCells;

  //------------------------------------------------------------------------

  let cellId: string = `${col.id},${row.id}`;
  let rowIdx: number = row.positionIndex + 1; //row.positionIndex is 0 based index. So we add 1 to it to get the actual row number.
  let colIdx: number = col.positionIndex;

  const getInitialContent = () => {
    let cellData: CellType[] | undefined = [];
    if (useYMapStore.getState().yMap !== undefined)
      cellData = useYMapStore.getState().yMap.get(cellId);
    if (cellData === undefined || cellData[0] === undefined) return "";
    return cellData[0].content;
  };

  const [content, setContent] = useState<string>(getInitialContent());

  useEffect(() => {
    const observer = (yMapEvent: any) => {
      yMapEvent.changes.keys.forEach(
        (change: { action: string; oldValue: any }, key: string) => {
          if (change.action === "update" && cellId === key) {
            if (
              yMap.get(cellId) !== undefined &&
              yMap!.get(cellId)!.length === 0
            )
              return;

            const updatedCell = yMap.get(cellId)?.[0];

            if (updatedCell?.formula !== undefined) {
              setContent(updatedCell.content);
              return;
            }

            let length: number = yMap!.get(cellId)!.length;
            for (let i = 0; i < length; i++)
              if (
                change.oldValue[0] !== undefined &&
                change.oldValue[0].id !== yMap!.get(cellId)![i].id
              ) {
                //only enters here if there are concurrent operations on the same cell.
                //check all the local yMap update wins set entries and compare with the remote changes. If id's of these operations differ then these are concurrent.
                yMap!.get(cellId)!.push(change.oldValue[0]);
              }

            if (yMap!.get(cellId)!.length == 1) {
              //if there are no concurrent operations
              setContent(yMap!.get(cellId)![0].content);
              return;
            }
            let currentCell = getCellContent(key)![0];

            let cellFinalContent: string = appendConcurrentUpdates();
            setYMapContent(
              cellId,
              yMap.get(cellId)![0].id,
              cellFinalContent,
              currentCell.formula ?? undefined,
              currentCell.formulaReferenceCellIds ?? undefined,
            );
            console.log("formula: ", currentCell.formula);
          } else if (change.action === "update" && cellId !== key) {
            // one of the formula cells has been updated.
          } else if (
            change.action === "add" &&
            cellId === key &&
            yMap.get(key) !== undefined &&
            yMap!.get(key)!.length === 1
          )
            setContent(yMap!.get(key)![0].content);
        },
      );
    };
    yMap.observe(observer);
    return () => {
      yMap.unobserve(observer);
    };
  }, [useYMapStore.getState()]);

  useEffect(() => {
    const observer = (yArrayEvent: any) => {
      for (const change of yArrayEvent.changes.delta) {
        if (change.insert === undefined) continue;
        for (const jsonString of change.insert) {
          const formulaData = JSON.parse(jsonString);
          if (formulaData.cellId !== cellId) continue;
          let newFormula: string = formulaData.formula;
          let formulaInstance: Formula = new Formula(newFormula, cellId, {
            row: rowIdx,
            col: getColumnLabel(colIdx),
            sheetName: "spreadsheet",
          });
          let markedCellsTemp: string[] = formulaInstance.getMarkedCells();

          setYMapContent(
            cellId,
            YDoc.clientID,
            formulaInstance.getFormulaResult(),
            newFormula,
            yMap.get(cellId)?.[0]?.formulaReferenceCellIds,
          );
          console.log(`New formula added: ${newFormula}`);
        }
      }
    };
    yAllFormulaCells.observe(observer);
    return () => {
      yAllFormulaCells.unobserve(observer);
    };
  }, [yAllFormulaCells, cellId, rowIdx, colIdx]);

  const appendConcurrentUpdates = (): string => {
    let cellFinalContent: string = ""; //when all the concurrent operations are appended to each other (if they exist).
    //yMap.get(cellId).length > 1 returns true if there are concurrent operations.
    for (
      let i = 0;
      i < yMap!.get(cellId)!.length &&
      YDoc.clientID !== yMap!.get(cellId)![i] &&
      yMap!.get(cellId)!.length > 1;
      i++
    )
      cellFinalContent += yMap!.get(cellId)![i].content;
    return cellFinalContent;
  };

  const findRightIndexForSortedInsert = (yarray: any, value: string) => {
    let left: number = 0;
    let right: number = yarray.length;

    while (left < right) {
      const mid: number = left + Math.floor((right - left) / 2);

      if (
        JSON.parse(yarray.get(mid)).formula.split("(")[1].split(")")[0] < value
      ) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return left;
  };

  const handleFocusOut = (e: React.ChangeEvent<HTMLInputElement>) => {
    if ((e.target.value as string) === yMap.get(cellId)?.[0]?.content) return; // optional chaining with "?.".

    let currentCell = getCurrentCellContent()?.[0];
    if (currentCell === undefined) return;
    if (
      currentCell.formula !== undefined &&
      (e.target.value as string) === currentCell.formula
    ) {
      setContent(currentCell.content);
      return;
    }

    const formulaPattern = /[A-Z]+\([A-Z*][0-9]+:[A-Z*][0-9]+\)/; //we should first check if the given text is a formula or not.
    const isValidFormula = formulaPattern.test(e.target.value as string);
    let formula: string | undefined;

    if (isValidFormula) {
      console.log(`formula qualified ${e.target.value}`);
      formula = e.target.value;
      let formulaInstance: Formula = new Formula(formula, cellId, {
        row: rowIdx,
        col: getColumnLabel(colIdx),
        sheetName: "spreadsheet",
      });
      let formulaRange: string = formula.split("(")[1].split(")")[0]; //get the range of the formula (e.g. A1:B2)
      let rightIndexForInsert: number = findRightIndexForSortedInsert(
        yAllFormulaCells,
        formulaRange,
      );
      yAllFormulaCells.insert(rightIndexForInsert, [formulaInstance.toJson()]); // This is used to keep track of all the formula cells in the spreadsheet.

      setContent(formulaInstance.getFormulaResult());
      return;
    }

    // this conditional is to update the content of the main formula cell. (REACTIVITY) ?. is "optional chaining".
    let i = 0;
    while (
      currentCell.formulaReferenceCellIds?.[i] !== undefined &&
      currentCell.formulaReferenceCellIds[i] !== cellId
    ) {
      setContent(e.target.value);
      setYMapContent(
        cellId,
        YDoc.clientID,
        e.target.value,
        undefined,
        currentCell.formulaReferenceCellIds,
      ); //updating the current cell itself (NOT FORMULA CELL)

      let referencedCellId: string = currentCell.formulaReferenceCellIds[i];
      let referencedCell = getCellContent(referencedCellId)?.[0]; //this is the formula cell that is referenced by the current cell. It has to be updated when the current cell is updated.
      if (referencedCell?.formula === undefined) {
        i += 1;
        continue;
      }
      const [referencedColId, referencedRowId] = referencedCellId.split(",");
      const referencedRowIdx = useYRowsStore
        .getState()
        .yRows.toArray()
        .indexOf(referencedRowId);
      const referencedColIdx = useYColumnsStore
        .getState()
        .yColumns.toArray()
        .indexOf(referencedColId);
      if (referencedRowIdx < 0 || referencedColIdx < 0) {
        i += 1;
        continue;
      }
      let formulaInstanceRemote = new Formula(
        referencedCell.formula,
        referencedCellId,
        {
          row: referencedRowIdx + 1,
          col: getColumnLabel(referencedColIdx),
          sheetName: "spreadsheet",
        },
      );
      formula = referencedCell.formula;

      setYMapContent(
        formulaInstanceRemote.getFormulaCellId(),
        YDoc.clientID,
        formulaInstanceRemote.getFormulaResult(),
        formulaInstanceRemote.getFormula(),
        referencedCell.formulaReferenceCellIds,
      ); //here updating the referenced formula cell.
      i += 1;
    }

    if (
      !isValidFormula &&
      currentCell.formulaReferenceCellIds?.[0] === undefined
    ) {
      //when current cell has no formula, no referenced formula cell. Just a normal one.

      // It also covers when there is a formula defined in the cell but gets deleted. In that case all the referenced cells have to be deregistered.
      // This is one of the reasons that the formula cell has the array of cells that are used to compute the final result.
      setContent(e.target.value);
      const currentFormulaData =
        currentCell.formula === undefined
          ? undefined
          : yAllFormulaCells
              .toArray()
              .map((jsonString: string) => JSON.parse(jsonString))
              .find(
                (data: any) =>
                  data.cellId === cellId &&
                  data.formula === currentCell.formula,
              );
      for (
        let i = 0;
        currentFormulaData?.markedCells?.length !== undefined &&
        i < currentFormulaData?.markedCells?.length;
        i++
      ) {
        //now deregister all the marked cells.
        deregisterFormulaElementCells(
          currentFormulaData?.markedCells?.[i] as string,
        );
      }

      setYMapContent(
        cellId,
        YDoc.clientID,
        e.target.value,
        undefined, //formula
        [],
      );
    }

    let keepId: RemoveKeepOperationId = `c${YDoc.clientID as number}.${1 as number}`;
    yColKeep.set(col.id, [keepId]);
    yRowKeep.set(row.id, [keepId]);
  };

  const handleFocus = () => {
    let currentCellArray = getCurrentCellContent();
    if (currentCellArray && currentCellArray[0]) {
      let currentCell = currentCellArray[0];
      if (currentCell.formula !== undefined) {
        setContent(currentCell.formula); //when the cell has a formula, then on focus it should display the formula instead of the result.
      }
    }
  };

  const deregisterFormulaElementCells = (targetCellId: string) => {
    const targetCell = getCellContent(targetCellId)?.[0];
    if (targetCell === undefined) return;
    setYMapContent(
      targetCellId,
      targetCell.id,
      targetCell.content,
      targetCell.formula,
      (targetCell.formulaReferenceCellIds ?? []).filter((id) => id !== cellId),
    );
  };

  const setYMapContent = (
    cellID: string,
    operationId: string | number,
    newContent: string,
    formula?: string,
    formulaReferenceCellIds?: string[],
  ) => {
    yMap.set(cellID, []);
    yMap.set(cellID, [
      {
        id: operationId,
        content: newContent,
        formula: formula ?? undefined,
        formulaReferenceCellIds: formulaReferenceCellIds ?? undefined,
      },
    ]);
  };

  const getCurrentCellContent = (): CellType[] | undefined => {
    return yMap.get(cellId);
  };

  const getCellContent = (targetCellId: string): CellType[] | undefined => {
    return yMap.get(targetCellId);
  };

  return (
    <>
      <div className="grid">
        <div className="col-12 md:col-6 lg:col-12">
          <InputField
            cellContent={content}
            handleFocusOut={handleFocusOut}
            handleFocus={handleFocus}
            setContent={setContent}
          />
        </div>
      </div>
    </>
  );
}

export default Cell;
