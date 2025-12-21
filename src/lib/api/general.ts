import { z, ZodError } from "zod";

type Handler<T, RETURN> = (data: T) => Promise<RETURN>;

export function defineApi<T, RETURN>(object: {
	input?: z.ZodType<T>;
	handler: Handler<T, RETURN>;
	onZodError?: (error: ZodError) => Promise<RETURN>;
}): (inputtedData?: T) => Promise<RETURN>;
export function defineApi<T, RETURN>({
	input,
	handler,
	onZodError,
}: {
	input?: z.ZodType<T>;
	handler: Handler<T, RETURN>;
	onZodError?: (error: ZodError) => Promise<RETURN>;
}): (inputtedData?: T) => Promise<RETURN> {
	const request = async (inputtedData?: T) => {
		const parsed = input?.safeParse(inputtedData);
		if (parsed && !parsed.success) {
			onZodError?.(parsed.error);
		}
		return handler(inputtedData as T);
	};
	return request;
}