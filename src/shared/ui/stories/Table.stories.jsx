import { Table, TableElement } from '@/shared/ui/Table.jsx';

const rows = [
  ['그리팅몰 할당', '두부버섯 도시락 · 350g', '284개', '양호'],
  ['경기 광주 냉동센터', '소고기 미역국 · 6팩', '155세트', '주의'],
  ['백화점 점포', '버섯 들깨탕 · 6팩', '120세트', '위험'],
];

const meta = {
  title: 'Shared UI/Table',
  component: Table,
  tags: ['autodocs'],
};

export default meta;

export const InventoryTable = {
  render: () => (
    <Table surface="bordered" density="default">
      <TableElement>
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-[length:var(--font-size-meta)] text-[color:var(--text-muted)]">
            <th className="px-4 py-3 font-semibold">판매처</th>
            <th className="px-4 py-3 font-semibold">상품명</th>
            <th className="px-4 py-3 font-semibold">현재고</th>
            <th className="px-4 py-3 font-semibold">위험등급</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([channel, product, stock, risk]) => (
            <tr key={product} className="border-b border-[var(--border)] last:border-b-0">
              <td className="px-4 py-3 text-[color:var(--text-body)]">{channel}</td>
              <td className="px-4 py-3 font-semibold text-[color:var(--text-heading)]">{product}</td>
              <td className="px-4 py-3 tabular-nums text-[color:var(--text-heading)]">{stock}</td>
              <td className="px-4 py-3 text-[color:var(--warning)]">{risk}</td>
            </tr>
          ))}
        </tbody>
      </TableElement>
    </Table>
  ),
};
