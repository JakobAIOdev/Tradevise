import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { columns, type PortfolioTableRow } from './TableColumns'

type HoldingsTableProps = {
  data: PortfolioTableRow[]
}

export default function HoldingsTable({ data }: HoldingsTableProps) {
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
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="w-full border-collapse">
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
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-b-0">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-25 py-18 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-25 py-25 text-body text-muted">
                No positions yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  )
}
