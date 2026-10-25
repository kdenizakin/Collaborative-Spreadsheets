import { useEffect, useState } from "react";
import InputField from "./InputField";
import {
  useYDocStore,
  useYMapStore,
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
  id: string;
  content: string;
  formula?: string;
  formulaReferenceCellIds?: string[]; // this points to the formula cell from the referenced cell.
  markedCells?: string[]; // if the cell has a formula then it has to store all the referenced cells. To "register" them for updates and "deregister" them.
};

function Cell(props: any) {
  const { row, col, getColumnLabel } = props;

  //-----------------------------Yjs States-----------------------------
  const YDoc = useYDocStore.getState().YDoc;
  const yMap = useYMapStore.getState().yMap;
  const yColKeep = useYColKeepStore.getState().yColKeep;
  const yRowKeep = useYRowKeepStore.getState().yRowKeep;

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

  const registerFormulaElementCells = (toBeRegisteredCell: string) => {
    let refCell = getCellContent(toBeRegisteredCell);

    if (refCell !== undefined && refCell[0]) {
      const currentCell = refCell[0];
      const currentRefs = currentCell.formulaReferenceCellIds || [];

      if (!currentRefs.includes(cellId)) {
        const newRefs = [...currentRefs, cellId];

        setYMapContent(
          toBeRegisteredCell,
          currentCell.id,
          currentCell.content,
          currentCell.formula,
          newRefs,
          currentCell.markedCells,
        );
      }
    } else console.log(`Cell is undefined ${toBeRegisteredCell}!`);
  };

  const deregisterFormulaElementCells = (toBeDeregisteredCell: string) => {
    let refCell = getCellContent(toBeDeregisteredCell);

    if (refCell !== undefined && refCell[0]) {
      const currentCell = refCell[0];
      setYMapContent(
        toBeDeregisteredCell,
        currentCell.id,
        currentCell.content,
        currentCell.formula,
        [],
        currentCell.markedCells,
      );
    } else console.log(`Cell is undefined ${toBeDeregisteredCell}!`);
  };

  const handleFocusOut = (e: React.ChangeEvent<HTMLInputElement>) => {
    if ((e.target.value as string) === yMap.get(cellId)?.[0].content) return; // optional chaining with "?.".

    let currentCell = getCurrentCellContent!()![0];
    if (
      currentCell.formula !== undefined &&
      (e.target.value as string) === currentCell.formula
    ) {
      setContent(currentCell.content);
      return;
    }
    console.log(currentCell);

    const formulaPattern = /[A-Z]+\([A-Z*][0-9]+:[A-Z*][0-9]+\)/; //we should first check if the given text is a formula or not.
    const isValidFormula = formulaPattern.test(e.target.value as string);
    let formula: string | undefined;

    if (isValidFormula) {
      console.log(`formula qualified ${e.target.value}`);
      formula = e.target.value;
      let formulaInstance = new Formula(formula, cellId, {
        row: rowIdx,
        col: getColumnLabel(colIdx),
        sheetName: "spreadsheet",
      });

      useYAllFormulaCellsStore
        .getState()
        .setAllFormulaCells(
          new Set<string>([
            ...useYAllFormulaCellsStore.getState().allFormulaCells,
            cellId,
          ]),
        ); // adding the formula cell to the set of all formula cells. To keep track of all the formula cells in the spreadsheet.

      if (formulaInstance.getFormulaResult() === "0") {
        setYMapContent(
          cellId,
          YDoc.clientID,
          "0",
          formulaInstance.getFormula(),
          currentCell.formulaReferenceCellIds,
          undefined,
        ); //update the formula cell itself (when current cell has the formula).
        setContent("0");
        //here updating the referenced formula cell.
        console.log(currentCell);
        return;
      }
      currentCell.markedCells = formulaInstance.getMarkedCells();
      for (let i = 0; i < formulaInstance.getMarkedCells().length; i++) {
        registerFormulaElementCells(formulaInstance.getMarkedCells()[i]);
      }
      setYMapContent(
        cellId,
        YDoc.clientID,
        formulaInstance.getFormulaResult(),
        formulaInstance.constructSingleFormulaString(),
        undefined,
        formulaInstance.getMarkedCells(),
      ); //update the formula cell itself (when current cell has the formula).
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
        undefined,
      ); //updating the current cell itself (NOT FORMULA CELL)

      let referencedCellId: string = currentCell.formulaReferenceCellIds[i];
      let referencedCell = getCellContent(referencedCellId)?.[i]; //this is the formula cell that is referenced by the current cell. It has to be updated when the current cell is updated.
      let formulaInstanceRemote = new Formula(
        referencedCell?.formula as string,
        referencedCellId,
        {
          row: rowIdx,
          col: colIdx,
          sheetName: "spreadsheet",
        },
      );
      formula = referencedCell?.formula;

      let result: { markedCells: string[]; formulaResult: string } =
        formulaInstanceRemote.recalculateFormula();

      let markedCellsTemp: string[] = formulaInstanceRemote.getMarkedCells();
      setYMapContent(
        formulaInstanceRemote.getFormulaCellId(),
        YDoc.clientID,
        formulaInstanceRemote.getFormulaResult(),
        formulaInstanceRemote.constructSingleFormulaString(),
        undefined,
        markedCellsTemp ? markedCellsTemp : undefined, //achtung: here referenced cell id might be undefined!!!!!!
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
      for (
        let i = 0;
        currentCell.markedCells?.length !== undefined &&
        i < currentCell.markedCells?.length;
        i++
      ) {
        //now deregister all the marked cells.
        deregisterFormulaElementCells(currentCell.markedCells[i]);
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
        setContent(currentCell.formula);
      }
    }
  };

  const setYMapContent = (
    cellID: string,
    operationId: string,
    newContent: string,
    formula?: string,
    formulaReferenceCellIds?: string[],
    markedCells?: string[],
  ) => {
    yMap.set(cellID, []);
    yMap.set(cellID, [
      {
        id: operationId,
        content: newContent,
        formula: formula ?? undefined,
        formulaReferenceCellIds: formulaReferenceCellIds ?? undefined,
        markedCells: markedCells ?? undefined,
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
