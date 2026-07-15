import { useEffect, useState } from "react";
import InputField from "./InputField";
import {
  useYDocStore,
  useYMapStore,
  useYColKeepStore,
  useYRowKeepStore,
} from "../YjsStore";

type RemoveKeepOperationId = `c${number}.${number}`;

//this array will be responsible from the update-wins semantics of the cell.
//Foe example, when two concurrent updates are made for the same cell, this array will store both updates and display content accordingly.
//If there are update and delete operations done concurrently, then update operations will win.
type CellType = {
  id: string;
  content: string;
  formula?: string;
  formulaReferenceCellIds?: string[];
  markedCells?: string[];
};

function Cell(props: any) {
  const { row, col, handleFormula } = props;

  //-----------------------------Yjs States-----------------------------
  const YDoc = useYDocStore.getState().YDoc;
  const yMap = useYMapStore.getState().yMap;
  const yColKeep = useYColKeepStore.getState().yColKeep;
  const yRowKeep = useYRowKeepStore.getState().yRowKeep;

  //------------------------------------------------------------------------

  let cellId: string = `${col.id},${row.id}`;
  let rowIdx: number = row.positionIndex;
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
    const setYmapEntry = useYMapStore.getState().setEntry;

    const observer = (yMapEvent: any) => {
      yMapEvent.changes.keys.forEach(
        (change: { action: string; oldValue: any }, key: string) => {
          if (change.action === "update" && cellId === key) {
            if (
              yMap.get(cellId) !== undefined &&
              yMap!.get(cellId)!.length === 0
            )
              return;

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
            console.log("sorun burada mi??");
            setYMapContent(
              cellId,
              yMap.get(cellId)![0].id,
              cellFinalContent,
              currentCell.formula ?? undefined,
              currentCell.formulaReferenceCellIds![0] ?? undefined,
            );
            console.log("formula: ", currentCell.formula);
          } else if (change.action === "update" && cellId !== key) {
            // one of the formula cells has been updated.
            /* setContent(yMap!.get(cellId)![0].content); */
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

  const markFormulaElementCells = (toBeMarkedCell: string, formula: string) => {
    let refCell = getCellContent(toBeMarkedCell);

    if (refCell !== undefined) {
      refCell![0].formulaReferenceCellIds = [cellId];
      refCell![0].formula = formula;

      console.log(
        `updated cells: ${JSON.stringify(yMap.get(toBeMarkedCell)![0])}`,
      );
    } else console.log(`Cell is undefined ${toBeMarkedCell}!`);
  };

  const handleFocusOut = (e: React.ChangeEvent<HTMLInputElement>) => {
    if ((e.target.value as string) === yMap.get(cellId)?.[0].content) return; // optional chaining with "?.".

    const formulaPattern = /[A-Z]+\([A-Z*][0-9]+:[A-Z*][0-9]+\)/; //we should first check if the given text is a formula or not.
    const isValidFormula = formulaPattern.test(e.target.value as string);
    let currentCell = getCurrentCellContent!()![0];
    let formula: string | undefined;

    if (isValidFormula) {
      console.log(`formula qualified ${e.target.value}`);
      formula = e.target.value;

      let result: { markedCells: string[]; formulaResult: string } =
        handleFormula(e.target.value as string, {
          row: rowIdx,
          col: colIdx,
          sheetName: "spreadsheet",
        });
      currentCell.markedCells = result.markedCells;

      for (let i = 0; i < result.markedCells.length; i++) {
        /*         console.log(`result.markedCells[i]: ${result.markedCells[i]}`);
         */ markFormulaElementCells(result.markedCells[i], formula);
      }
      setYMapContent(cellId, YDoc.clientID, result.formulaResult, formula, []); //update the formula cell.
      setContent(result.formulaResult);
      return;
    }

    // this conditional is to update the content of the main formula cell. ?. is "optional chaining".
    if (
      currentCell.formulaReferenceCellIds?.[0] !== undefined &&
      currentCell.formulaReferenceCellIds[0] !== cellId
    ) {
      setContent(e.target.value);
      setYMapContent(
        cellId,
        YDoc.clientID,
        e.target.value,
        undefined,
        currentCell.formulaReferenceCellIds,
      ); //updating the current cell

      let referencedCellId: string = currentCell.formulaReferenceCellIds[0];
      formula = getCellContent(currentCell.formulaReferenceCellIds[0])![0]
        .formula;
      let result: { markedCells: string[]; formulaResult: string } =
        handleFormula(formula as string, {
          row: rowIdx,
          col: colIdx,
          sheetName: "spreadsheet",
        });
      setYMapContent(
        referencedCellId,
        YDoc.clientID,
        result.formulaResult,
        formula,
        [],
      ); //here updating the referenced cell.
    } else {
      console.log("here2");
      setContent(e.target.value);
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

  const setYMapContent = (
    cellID: string,
    operationId: string,
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
            setContent={setContent}
          />
          {cellId}
        </div>
      </div>
    </>
  );
}

export default Cell;
