import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ServerForm } from "./serverComponents";

export default function Index() {
	return (
		<Tabs defaultValue="purchaseForm">
			<TabsList>
				<TabsTrigger value="purchaseForm" asChild>
					<Link href="/">入力</Link>
				</TabsTrigger>
				<TabsTrigger value="unsettled" asChild>
					<Link href="/unsettled">未精算リスト</Link>
				</TabsTrigger>
				<TabsTrigger value="settled" asChild>
					<Link href="/settled">精算済リスト</Link>
				</TabsTrigger>
				<TabsTrigger value="member" asChild>
					<Link href="/member">メンバー管理</Link>
				</TabsTrigger>
			</TabsList>
			<TabsContent value="purchaseForm">
				<ServerForm />
			</TabsContent>
		</Tabs>
	);
}
