"use client";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { MODAL_INSTRUCTION, MODAL_STRUCTURE } from "./types";
import { useReducer } from "react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import cloneDeep from "lodash/cloneDeep";
import  { X, TriangleAlert, Info } from "lucide-react";
import { Check } from "@/components/animate-ui/icons/check"
import { LoaderCircle } from "../animate-ui/icons/loader-circle";

// EXPORT OR COPY THIS ONE
export const modalStructure: MODAL_STRUCTURE = {
	isOpen: false,
	width: "450px",
	icon: <Check animate />,
	title: "Title",
	message:
		"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Minima adipisci recusandae tempore unde. Ut rem a asperiores laboriosam fugiat molestiae possimus quisquam excepturi, ullam ratione rerum distinctio, et inventore obcaecati.",
	additionalBody: undefined,
	acceptButton: true,
	rejectButton: true,
	acceptButtonText: "Close",
	rejectButtonText: "Cancel",
	acceptButtonCallback: undefined,
	rejectButtonCallback: undefined,
	closeButton: true,
	closeButtonCallback: undefined,
	backdropTrigger: true,
	backdropTriggerCallback: undefined,
	customDialog: undefined,
};

export function useModalReducer() {
	return useReducer((x, instruction: MODAL_INSTRUCTION) => {
		switch (instruction.type) {
			case "open":
				return { ...x, isOpen: true };
			case "close":
				return { ...x, isOpen: false };
			case "update":
				return { ...x, ...(instruction.data ? instruction.data : {}) };
			default:
				return x;
		}
	}, cloneDeep(modalStructure));
}

export function makeSuccessModal(struct: Partial<MODAL_STRUCTURE>): MODAL_INSTRUCTION {
	const structRefined: MODAL_STRUCTURE = {
		...modalStructure,
		isOpen: true,
		icon: <Check animate className="text-green-500" />,
		title: "Success",
		rejectButton: false,
		...struct,
	};
	return { type: "update", data: structRefined };
}

export function makeErrorModal(struct: Partial<MODAL_STRUCTURE>): MODAL_INSTRUCTION {
	const structRefined: MODAL_STRUCTURE = {
		...modalStructure,
		isOpen: true,
		icon: <X className=" text-red-500" />,
		title: "Error",
		rejectButton: false,
		...struct,
	};
	return { type: "update", data: structRefined };
}

export function makeWarningModal(struct: Partial<MODAL_STRUCTURE>): MODAL_INSTRUCTION {
	const structRefined: MODAL_STRUCTURE = {
		...modalStructure,
		isOpen: true,
		icon: <TriangleAlert className="text-amber-500"/>,
		title: "Warning",
		...struct,
	};
	return { type: "update", data: structRefined };
}

export function makeInfoModal(struct: Partial<MODAL_STRUCTURE>): MODAL_INSTRUCTION {
	const structRefined: MODAL_STRUCTURE = {
		...modalStructure,
		isOpen: true,
		icon: <Info className="text-sky-600" />,
		title: "Information",
		...struct,
	};
	return { type: "update", data: structRefined };
}

export function makeLoadingModal(struct: Partial<MODAL_STRUCTURE>): MODAL_INSTRUCTION {
	const structRefined: MODAL_STRUCTURE = {
		...modalStructure,
		isOpen: true,
		icon: <LoaderCircle animate />,
		title: "Loading",
		message: "",
		backdropTrigger: undefined,
		acceptButton: undefined,
		rejectButton: undefined,
		closeButton: false,
		...struct,
	};
	return { type: "update", data: structRefined };
}

export function makeCloseModal(): MODAL_INSTRUCTION {
	return { type: "close" };
}

export function makeDefaultModal(struct: Partial<MODAL_STRUCTURE>): MODAL_INSTRUCTION {
	const structRefined: MODAL_STRUCTURE = {
		...modalStructure,
		isOpen: true,
		...struct,
	};
	return { type: "update", data: structRefined };
}

export default function ModalBase(props: { reducer: ReturnType<typeof useModalReducer> }) {
	const [state, dispatch] = props.reducer;
	return (
		<>
			<Dialog open={state.isOpen}>
				<DialogContent
					aria-describedby="dialog-description"
					width={state.width.toString()}
					showCloseButton={!!state.closeButton}
					onClose={() => {
						if (state.closeButtonCallback) state.closeButtonCallback(() => dispatch({ type: "close" }));
						else dispatch({ type: "close" });
					}}
					onPointerDownOutside={(e) => {
						if (!state.backdropTrigger) {
							e.preventDefault();
							return;
						}
						if (state.backdropTriggerCallback) state.backdropTriggerCallback(() => dispatch({ type: "close" }));
						dispatch({ type: "close" });
					}}
				>
					{state.customDialog ? (
						<>
							<ScrollArea className="max-h-[calc(100vh-5rem)]">
								<div className="hidden">
									<DialogTitle>{state.title}</DialogTitle>
								</div>
								{typeof state.customDialog === "function" ? state.customDialog(state) : state.customDialog}
							</ScrollArea>
						</>
					) : (
						<>
							<DialogHeader>
								<DialogTitle className="flex items-center gap-1 font-normal">
									{state.icon}
									{state.title}
								</DialogTitle>
								<DialogDescription className={`${!!state.message || "hidden"}`}>{state.message}</DialogDescription>
							</DialogHeader>
							{state.additionalBody && (
								<div className="max-h-[calc(100vh-10rem)] overflow-y-auto relative">{state.additionalBody}</div>
							)}
							<DialogFooter
								className={`mt-3 h-fit relative z-10 ${!state.acceptButton && !state.rejectButton ? "hidden" : ""}`}
							>
								<Button
									className={`${state.acceptButton ? "" : "hidden"}`}
									type="submit"
									onClick={() => {
										if (state.acceptButtonCallback) {
											state.acceptButtonCallback(() => dispatch({ type: "close" }));
											return;
										}
										dispatch({ type: "close" });
									}}
								>
									{state.acceptButtonText}
								</Button>

								<Button
									variant="outline"
									className={`${state.rejectButton ? "" : "hidden"}`}
									onClick={() => {
										if (state.rejectButtonCallback) {
											state.rejectButtonCallback(() => dispatch({ type: "close" }));
											return;
										}
										dispatch({ type: "close" });
									}}
								>
									{state.rejectButtonText}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
