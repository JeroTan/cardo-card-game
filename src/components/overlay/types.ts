import type { ReactNode } from "react";


// Alert Structure Interface
export type ALERT_STRUCTURE = {
	isOpen: boolean;
	width: string | number | null;
  type: "default"|"success"|"error"
	icon: ReactNode,
	title: string | number;
	message: string | number | ReactNode
	closeButton: boolean | undefined;
	closeButtonCallback: undefined | ((closeModal: () => void) => void);
} 
export type ALERT_INSTRUCTION = {
  type: "open"|"close"|"update",
  data?: Partial<ALERT_STRUCTURE>
}


// Modal TYPE SETUP
export type MODAL_STRUCTURE = {
	isOpen: boolean;
	width: string | number;
	icon: ReactNode;
	title: string | number;
	message: string | number;
	additionalBody: string | ReactNode | undefined;
	acceptButton: boolean | undefined;
	rejectButton: boolean | undefined;
	acceptButtonText: string;
	rejectButtonText: string;
	acceptButtonCallback: undefined | ((closeModal: () => void) => void);
	rejectButtonCallback: undefined | ((closeModal: () => void) => void);
	closeButton: boolean | undefined;
	closeButtonCallback: undefined | ((closeModal: () => void) => void);
	backdropTrigger: boolean | undefined;
	backdropTriggerCallback: undefined | ((closeModal: () => void) => void);
	customDialog: undefined | string | ReactNode | ((data: MODAL_STRUCTURE) => string | ReactNode);
}

export type MODAL_INSTRUCTION = {
	type: "open" | "close" | "update";
	data?: Partial<MODAL_STRUCTURE>;
};