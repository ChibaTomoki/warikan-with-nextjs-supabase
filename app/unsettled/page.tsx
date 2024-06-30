import { TabList } from "../purchase-form/_components";
import { Table } from "./_clientComponents";

export default function Unsettled() {
	return (
		<div>
			<h1>未精算リストページ</h1>
			<TabList
				tabItems={[
					{ label: "入力", href: "/purchase-form" },
					{ label: "未精算リスト", href: "/unsettled" },
					{ label: "精算済リスト", href: "settled" },
				]}
			/>
			<Table />
		</div>
	);
}
