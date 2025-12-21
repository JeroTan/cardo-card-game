import { useState } from "react";

export function useMultiStateField<T extends object>(
	initialState: T,
): { [K in keyof T]: { get: T[K]; set: React.Dispatch<React.SetStateAction<T[K]>> } } {
	const [state, setState] = useState(initialState);
	const result: { [K in keyof T]: { get: T[K]; set: React.Dispatch<React.SetStateAction<T[K]>> } } = {} as any;

	for (const key in state) {
		result[key as keyof T] = {
			get: state[key as keyof T],
			set: (value) => setState((prev) => ({ ...prev, [key]: value })),
		};
	}

	return result;
}