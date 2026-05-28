import './App.css';
import React, { useState, useEffect } from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { WebsocketProvider } from 'y-websocket';
import { nanoid as uuidv4 } from 'nanoid';
import * as Y from 'yjs';

const yDoc = new Y.Doc();
//const wsProvider = new WebsocketProvider('ws://localhost:1234', 'removeKeep', yDoc);

const yMap = yDoc.getMap('spreadsheet');
const yColumns = yDoc.getArray('columns');
const yRows = yDoc.getArray('rows');

const undoColumns = new Y.UndoManager(yColumns);
const undoRows = new Y.UndoManager(yRows);
const yColKeep = yDoc.getMap('column-keep');
const yRowKeep = yDoc.getMap('row-keep');


function SpreadsheetRemoveKeep() {

    const [columns, setColumns] = useState<ColumnType[]>([]);
    const [rows, setRows] = useState<RowType[]>([]);


    const [nextColId, setNextColId] = useState<number>(0);
    const [nextRowId, setNextRowId] = useState<number>(0);


    const addColumn = () => {
        setColumns((oldColumn: ColumnType[]): ColumnType[] => [...oldColumn, { id: nextColId, content: "col" + nextColId }]);
        setNextColId(nextColId + 1);
    };

    const addRow = () => {
        setRows((oldRow: RowType[]): RowType[] => [...oldRow, { id: nextRowId, content: <InputField />}]);
        setNextRowId((oldId: number): number => oldId + 1);
    };


    const header = (
        <>
            <span className="flex flex-wrap align-items-center justify-content-between gap-1">
                <Button icon="pi pi-refresh" rounded raised onClick={addColumn}>Add Column</Button>
            </span>
            <span className="flex flex-wrap align-items-center justify-content-between gap-1">
                <Button icon="pi pi-refresh" rounded raised onClick={addRow}>Add Row</Button>
            </span>
        </>
    );

    return (
        <div className="card">
            <DataTable value={rows} header={header} className="spread_sheet">
                {columns.map((item: ColumnType) => <Column key={item.id} field="content" header={`Column ${item.id}`} />)}
            </DataTable>
        </div >
    );
}

export default SpreadSheet