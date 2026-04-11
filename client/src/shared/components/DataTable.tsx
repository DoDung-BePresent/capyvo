import { Card, Table, type TableProps } from 'antd'
import type { AnyObject } from 'antd/es/_util/type'
import type { ReactNode } from 'react'

type DataTableProps<T extends AnyObject = AnyObject> = TableProps<T> & {
  filter?: ReactNode
  noCard?: boolean
}

export const DataTable = <T extends AnyObject = AnyObject>({
  pagination,
  className,
  filter,
  noCard,
  ...tableProps
}: DataTableProps<T>) => {
  const defaultPagination = {
    pageSize: 10,
    showSizeChanger: true,
    showTotal: (total: number) => `Total ${total} items`,
    style: { paddingInline: 16, paddingBottom: 16, marginBottom: 0 },
    ...pagination,
  }

  const tableElement = (
    <Table
      {...tableProps}
      styles={{
        root: {
          background: 'white',
        },
        content: { scrollbarWidth: 'thin', scrollbarColor: '#eaeaea transparent' },
        ...tableProps.styles,
      }}
      pagination={defaultPagination}
    />
  )

  if (noCard) return tableElement

  return (
    <>
      {filter && (
        <Card style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>{filter}</Card>
      )}
      <Card
        styles={{ body: { padding: 0 } }}
        style={
          filter ? { borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 0 } : undefined
        }
        className={!filter ? className : undefined}
      >
        {tableElement}
      </Card>
    </>
  )
}
