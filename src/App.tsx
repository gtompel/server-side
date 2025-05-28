import React from 'react';
import { TableProvider } from './context/TableContext';
import DataTable from './components/DataTable';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <TableProvider>
        <DataTable />
      </TableProvider>
    </div>
  );
}

export default App;