"use client";

import Input from "@/components/clients/Input";
import type { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Fragment, useCallback, useEffect, useId, useState } from "react";
import { type SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

type toZod<T extends Record<string, unknown>> = {
	[K in keyof T]-?: z.ZodType<T[K]>;
};

type FormItems = {
	title: string;
	date: string;
	note?: string;
	purchasers: (Database["public"]["Tables"]["purchasers"]["Row"] & {
		amountPaid?: number;
		amountToPay?: number;
	})[];
};

export const Form = () => {
	const componentId = useId();

	const supabase = createClient();

	const zodSchema = z.object<toZod<FormItems>>({
		title: z.string().min(1, { message: "必須" }),
		date: z.string(),
		note: z.string().optional(),
		purchasers: z.array(
			z.object({
				created_at: z.string(),
				id: z.number(),
				name: z.string(),
				user_id: z.string(),
				amountPaid: z
					.union([
						z
							.number()
							.nonnegative({ message: "0以上の値じゃないとダメ" })
							.int({ message: "正数じゃないとダメ" }),
						z.nan(),
					])
					.optional(),
				amountToPay: z
					.union([
						z
							.number()
							.nonnegative({ message: "0以上の値じゃないとダメ" })
							.int({ message: "正数じゃないとダメ" }),
						z.nan(),
					])
					.optional(),
			}),
		),
	});

	const {
		control,
		register,
		handleSubmit,
		formState: { errors: formStateErrors },
	} = useForm<FormItems>({
		resolver: zodResolver(zodSchema),
	});
	const {
		fields: purchasersFields,
		append: purchasersAppend,
		remove: purchasersRemove,
	} = useFieldArray({
		control,
		name: "purchasers",
	});

	const [purchasers, setPurchasers] = useState<
		Database["public"]["Tables"]["purchasers"]["Row"][] | null
	>(null);

	const readPurchaser = useCallback(async () => {
		const { data, error } = await supabase
			.from("purchasers")
			.select("*")
			.order("created_at", { ascending: true });
		if (error) {
			console.error(error);
			return;
		}
		setPurchasers(data);
	}, [supabase]);

	const insertPurchase = async ({
		title,
		date,
		note,
		purchasers,
	}: {
		title: string;
		date: string;
		note?: string;
		purchasers: {
			id: number;
			amountPaid?: number;
			amountToPay?: number;
		}[];
	}) => {
		const { data: purchaseData, error: purchaseError } = await supabase
			.from("purchases")
			.insert([{ title, purchase_date: date || null, note }])
			.select();
		if (purchaseError) {
			console.error(purchaseError);
			return;
		}
		const insertedPurchaseData = purchaseData[0];
		if (!insertedPurchaseData) {
			console.error("Inserted purchase data doesn't exist.");
			return;
		}

		for (const x of purchasers) {
			supabase
				.from("purchasers_purchases")
				.insert([
					{
						purchase_id: insertedPurchaseData.id,
						purchaser_id: x.id,
						amount_paid: x.amountPaid ?? null,
						amount_to_pay: x.amountToPay ?? null,
					},
				])
				.select()
				.then(({ error }) => {
					// TODO: トランザクション処理
					if (error)
						alert(
							`処理に失敗しました。purchases tableからid=${insertedPurchaseData.id}に紐づく行を削除してください。`,
						);
				});
		}
	};

	const onSubmit: SubmitHandler<FormItems> = (e) => {
		insertPurchase({
			title: e.title,
			date: e.date,
			note: e.note,
			purchasers: e.purchasers.map((x) => ({
				id: x.id,
				amountPaid: x.amountPaid,
				amountToPay: x.amountToPay,
			})),
		});
	};

	useEffect(() => {
		readPurchaser();
	}, [readPurchaser]);

	useEffect(() => {
		if (!purchasers) return;

		for (const x of purchasers) {
			purchasersAppend({ ...x, amountPaid: undefined, amountToPay: undefined });
		}

		return () => {
			purchasersRemove(purchasers.map((_, i) => i));
		};
	}, [purchasers, purchasersAppend, purchasersRemove]);

	return (
		<form onSubmit={handleSubmit(onSubmit)}>
			<div>
				<label htmlFor={`${componentId}-title`}>購入品名</label>
				<Input id={`${componentId}-title`} {...register("title")} />
				{formStateErrors.title?.message && (
					<p className="text-white">{formStateErrors.title?.message}</p>
				)}
			</div>
			<div>
				<label htmlFor={`${componentId}-date`}>購入日</label>
				<Input id={`${componentId}-date`} type="date" {...register("date")} />
			</div>
			<div>
				<label htmlFor={`${componentId}-note`}>メモ</label>
				<Input id={`${componentId}-note`} {...register("note")} />
			</div>
			<div>
				<span>支払額</span>
				<div>
					{purchasersFields.map((field, index) => (
						<Fragment key={field.id}>
							<label htmlFor={field.id}>{field.name}</label>
							<Input
								key={field.id}
								id={field.id}
								{...register(`purchasers.${index}.amountPaid`, {
									valueAsNumber: true,
								})}
							/>
							{formStateErrors.purchasers?.[index]?.amountPaid?.message && (
								<p>
									{formStateErrors.purchasers?.[index]?.amountPaid?.message}
								</p>
							)}
						</Fragment>
					))}
				</div>
			</div>
			<div>
				<span>割勘金額</span>
				<div>
					{purchasersFields.map((field, index) => (
						<Fragment key={field.id}>
							<label htmlFor={field.id}>{field.name}</label>
							<Input
								key={field.id}
								id={field.id}
								{...register(`purchasers.${index}.amountToPay`, {
									valueAsNumber: true,
								})}
							/>
							{formStateErrors.purchasers?.[index]?.amountToPay?.message && (
								<p>
									{formStateErrors.purchasers?.[index]?.amountToPay?.message}
								</p>
							)}
						</Fragment>
					))}
				</div>
			</div>
			<button type="submit">追加</button>
		</form>
	);
};
