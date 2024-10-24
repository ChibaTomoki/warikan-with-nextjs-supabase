"use client";

import ErrorMessage from "@/components/ErrorMessage";
import NodataMessage from "@/components/NodataMessage";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import type { UseQueryDataAndStatus } from "@/utils/supabase/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, Ellipsis } from "lucide-react";
import { useEffect, useState } from "react";
import { usePurchaseForm } from "../clientComponents";

type ControlMenuProps = {
	initialPurchasers: Parameters<typeof usePurchaseForm>[0];
	purchaseId: Parameters<typeof usePurchaseForm>[1];
	purchase: Parameters<typeof usePurchaseForm>[2];
};
const ControlMenu = ({
	initialPurchasers,
	purchaseId,
	purchase,
}: ControlMenuProps) => {
	const supabase = createClient();
	const queryClient = useQueryClient();

	const [dialogIsOpen, setDialogIsOpen] = useState(false);

	const {
		calculateDistributeRemainderRandomly,
		form,
		handleSubmitUpdate,
		purchaserNames,
		purchasersAmountPaidFields,
		purchasersAmountToPayFields,
		watchedPurchasersAmountPaid,
		purchasersAmountPaidSum,
	} = usePurchaseForm(initialPurchasers, purchaseId, purchase, () => {
		setDialogIsOpen(false);
	});

	const [equallyDivideCheckIsChecked, setEquallyDivideCheckIsChecked] =
		useState(false);

	const deletePurchaseMutation = useMutation({
		mutationFn: async (purchaseId: number) => {
			const { error } = await supabase
				.from("purchases")
				.delete()
				.eq("id", purchaseId);
			if (error) throw new Error(error.message);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["purchases"] });
		},
	});
	const unsettlePurchaseMutation = useMutation({
		mutationFn: async (purchaseId: number) => {
			const { error } = await supabase
				.from("purchases")
				.update({ is_settled: false })
				.eq("id", purchaseId)
				.select();
			if (error) throw new Error(error.message);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["purchases"] });
		},
	});

	return (
		<Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
			<DropdownMenu>
				<DropdownMenuTrigger>
					<Ellipsis />
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem
						onClick={() =>
							purchaseId && unsettlePurchaseMutation.mutate(purchaseId)
						}
					>
						未精算
					</DropdownMenuItem>
					<DialogTrigger onClick={() => setDialogIsOpen(true)} asChild>
						<DropdownMenuItem>編集</DropdownMenuItem>
					</DialogTrigger>
					<DropdownMenuItem
						onClick={() =>
							purchaseId && deletePurchaseMutation.mutate(purchaseId)
						}
					>
						削除
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>購入品情報編集</DialogTitle>
				</DialogHeader>
				<div className="overflow-auto h-96">
					<Form {...form}>
						<form
							id="purchaseUpdateForm"
							onSubmit={form.handleSubmit(handleSubmitUpdate)}
							className="space-y-8"
						>
							<FormField
								control={form.control}
								name="title"
								render={({ field }) => (
									<FormItem>
										<FormLabel>購入品名</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="date"
								render={({ field }) => (
									<FormItem className="flex flex-col">
										<FormLabel>購入日</FormLabel>
										<Popover>
											<PopoverTrigger asChild>
												<FormControl>
													<Button
														variant={"outline"}
														className={cn(
															"w-[240px] pl-3 text-left font-normal",
															!field.value && "text-muted-foreground",
														)}
													>
														{field.value ? (
															format(field.value, "PPP")
														) : (
															<span>Pick a date</span>
														)}
														<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
													</Button>
												</FormControl>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<Calendar
													mode="single"
													selected={field.value}
													onSelect={field.onChange}
													disabled={(date) =>
														date > new Date() || date < new Date("1900-01-01")
													}
													initialFocus
												/>
											</PopoverContent>
										</Popover>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="note"
								render={({ field }) => (
									<FormItem>
										<FormLabel>メモ</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{purchaserNames.status === "error" ? (
								<p>error</p>
							) : (
								<>
									<Card>
										<CardHeader>
											<CardTitle>支払額</CardTitle>
										</CardHeader>
										<CardContent>
											<ul>
												{purchasersAmountPaidFields.map((item, index) => (
													<li key={item.id}>
														<FormField
															control={form.control}
															name={`purchasersAmountPaid.${index}.amountPaid`}
															render={({ field }) => (
																<FormItem>
																	<FormLabel>
																		{purchaserNames.data[index]}
																	</FormLabel>
																	<FormControl>
																		<Input
																			{...field}
																			onChange={(e) => {
																				const inputValue = e.target.value;
																				const inputValueAsNumber =
																					Number(inputValue);
																				if (
																					!inputValue ||
																					Number.isNaN(inputValueAsNumber)
																				)
																					field.onChange(inputValue);
																				else field.onChange(inputValueAsNumber);

																				if (!equallyDivideCheckIsChecked)
																					return;

																				const amountPaidSum =
																					watchedPurchasersAmountPaid.reduce(
																						(
																							accumulator,
																							currentValue,
																							currentIndex,
																						) => {
																							if (currentIndex === index)
																								return (
																									accumulator +
																									Number(e.target.value ?? 0)
																								);
																							return (
																								accumulator +
																								Number(
																									currentValue.amountPaid ?? 0,
																								)
																							);
																						},
																						0,
																					);

																				calculateDistributeRemainderRandomly(
																					amountPaidSum,
																				);
																			}}
																			placeholder="0"
																			inputMode="numeric"
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>
													</li>
												))}
											</ul>
										</CardContent>
									</Card>

									<Card>
										<CardHeader>
											<CardTitle>割勘金額</CardTitle>
										</CardHeader>
										<CardContent>
											<Switch
												id="equallyDivideCheck"
												onCheckedChange={() => {
													setEquallyDivideCheckIsChecked((prev) => !prev);

													if (equallyDivideCheckIsChecked) return;

													const amountPaidSum =
														watchedPurchasersAmountPaid.reduce(
															(accumulator, currentValue) => {
																return (
																	accumulator +
																	Number(currentValue.amountPaid ?? 0)
																);
															},
															0,
														);

													calculateDistributeRemainderRandomly(amountPaidSum);
												}}
												checked={equallyDivideCheckIsChecked}
											/>
											<Label htmlFor="equallyDivideCheck">等分</Label>

											<ul>
												{purchasersAmountToPayFields.map((item, index) => (
													<li key={item.id} className="py-4">
														<FormField
															control={form.control}
															name={`purchasersAmountToPay.${index}.amountToPay`}
															render={({ field }) => (
																<FormItem>
																	<div className="flex items-center justify-between">
																		<FormLabel>
																			{purchaserNames.data[index]}
																		</FormLabel>
																		<Button
																			type="button"
																			className="h-8"
																			variant="outline"
																			onClick={() => {
																				const otherPurchaserAmountToPays = form
																					.getValues()
																					.purchasersAmountToPay.reduce(
																						(
																							accumulator,
																							currentValue,
																							currentIndex,
																						) => {
																							if (currentIndex === index)
																								return accumulator;
																							return (
																								accumulator +
																								(typeof currentValue.amountToPay ===
																								"number"
																									? currentValue.amountToPay
																									: 0)
																							);
																						},
																						0,
																					);
																				field.onChange(
																					purchasersAmountPaidSum -
																						otherPurchaserAmountToPays,
																				);
																			}}
																		>
																			残りを自動入力
																		</Button>
																	</div>
																	<FormControl>
																		<Input
																			{...field}
																			onChange={(e) => {
																				const inputValue = e.target.value;
																				const inputValueAsNumber =
																					Number(inputValue);
																				if (
																					!inputValue ||
																					Number.isNaN(inputValueAsNumber)
																				)
																					field.onChange(e);
																				else field.onChange(inputValueAsNumber);
																			}}
																			placeholder="0"
																			inputMode="numeric"
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>
													</li>
												))}
											</ul>
										</CardContent>
									</Card>
								</>
							)}
						</form>
					</Form>
				</div>
				<DialogFooter>
					<Button type="submit" form="purchaseUpdateForm">
						OK
					</Button>
					<DialogClose asChild>
						<Button
							type="button"
							onClick={() => {
								form.reset();
								setDialogIsOpen(false);
							}}
						>
							キャンセル
						</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

type ClientSettledTableProps = {
	initialPurchases: {
		id: number;
		title: string;
		purchase_date: string | null;
		note: string;
		is_settled: boolean;
		purchasers_purchases: {
			id: number;
			purchaser_id: number;
			amount_paid: number | null;
			amount_to_pay: number | null;
		}[];
	}[];
	initialPurchasers: {
		id: number;
		name: string;
	}[];
};
export const ClientSettledTable = ({
	initialPurchases,
	initialPurchasers,
}: ClientSettledTableProps) => {
	const supabase = createClient();
	const queryClient = useQueryClient();

	const purchasesCache = useQuery({
		queryKey: ["purchases", "settled"],
		queryFn: async () => {
			const { data: purchasesData, error: purchasesError } = await supabase
				.from("purchases")
				.select(
					`
					id,
					title,
					purchase_date,
					note,
					is_settled,
					purchasers_purchases ( id, purchaser_id, amount_paid, amount_to_pay )
				`,
				)
				.eq("is_settled", true)
				.order("created_at", { ascending: true });
			if (purchasesError) throw new Error(purchasesError.message);

			return purchasesData;
		},
		initialData: initialPurchases,
	});

	const purchaseTableData: UseQueryDataAndStatus<
		{
			id: number;
			title: string;
			date: string | undefined;
			note: string;
			purchasers: {
				id: number;
				purchaser_id: number;
				amount_paid: number | null;
				amount_to_pay: number | null;
			}[];
			totalAmount: number;
		}[]
	> =
		purchasesCache.status === "error"
			? { status: "error", data: undefined, isRefetching: false }
			: {
					status: "success",
					data: purchasesCache.data.map((x) => ({
						id: x.id,
						title: x.title,
						date: x.purchase_date ?? undefined,
						note: x.note,
						purchasers: x.purchasers_purchases,
						totalAmount: x.purchasers_purchases.reduce(
							(previous, current) => previous + (current.amount_paid ?? 0),
							0,
						),
					})),
					isRefetching: false,
				};

	const deletePurchaseMutation = useMutation({
		mutationFn: async (purchaseId: number) => {
			const { error } = await supabase
				.from("purchases")
				.delete()
				.eq("id", purchaseId);
			if (error) throw new Error(error.message);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["purchases"] });
		},
	});

	const unsettlePurchaseMutation = useMutation({
		mutationFn: async (purchaseId: number) => {
			const { error } = await supabase
				.from("purchases")
				.update({ is_settled: false })
				.eq("id", purchaseId)
				.select();
			if (error) throw new Error(error.message);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["purchases"] });
		},
	});

	useEffect(() => {
		queryClient.invalidateQueries({ queryKey: ["purchases", "settled"] });
	}, [queryClient]);

	return (
		<>
			{purchaseTableData.status === "error" ||
			deletePurchaseMutation.status === "error" ||
			unsettlePurchaseMutation.status === "error" ? (
				<ErrorMessage />
			) : purchaseTableData.data.length === 0 ? (
				<NodataMessage />
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>購入品名</TableHead>
							<TableHead>購入日</TableHead>
							<TableHead>合計金額(円)</TableHead>
							<TableHead className="w-[20px]" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{purchaseTableData.data.map((purchase) => (
							<TableRow key={purchase.id}>
								<TableCell>{purchase.title}</TableCell>
								<TableCell>{purchase.date}</TableCell>
								<TableCell>{purchase.totalAmount}</TableCell>
								<TableCell>
									<ControlMenu
										initialPurchasers={initialPurchasers}
										purchaseId={purchase.id}
										purchase={{
											title: purchase.title,
											date: purchase.date ? new Date(purchase.date) : undefined,
											note: purchase.note,
											purchasersAmountPaid: purchase.purchasers.map((x) => ({
												amountPaid: x.amount_paid ?? 0,
											})),
											purchasersAmountToPay: purchase.purchasers.map((x) => ({
												amountToPay: x.amount_to_pay ?? 0,
											})),
										}}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</>
	);
};
