import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { columns, type PortfolioTableRow } from './TableColumns'
import MobileHoldingCard from './MobileHoldingCard'
import Card from '../Card'

type HoldingsTableProps = {
  data: PortfolioTableRow[]
}

export default function HoldingsTable({ data }: HoldingsTableProps) {
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      sorting: [{ id: 'value', desc: true }],
    },
  })

  return (
    <Card as="section" padding="none" className="holdings-layout overflow-visible">
      {table.getRowModel().rows.length > 0 ? (
        <>
          <div className="holdings-mobile divide-y divide-border">
            {table.getRowModel().rows.map((row) => (
              <MobileHoldingCard key={row.id} item={row.original} />
            ))}
          </div>
          <table className="holdings-table min-w-190 w-full border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border">
                  {headerGroup.headers.map((header) => {
                    const isNumericColumn = header.column.id !== 'asset'

                    return (
                      <th
                        key={header.id}
                        className={`px-25 py-18 text-small text-muted ${
                          isNumericColumn ? 'text-right' : 'text-left'
                        }`}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-b-0">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-25 py-18 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div className="px-25 py-25 text-body text-muted">No positions yet.</div>
      )}
    </Card>
  )
}
