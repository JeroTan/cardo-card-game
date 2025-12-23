import type { ValidationError } from "elysia/error";
import { z, ZodError } from "zod";
import { handleTypeboxError } from "../typebox/formatter";

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

export function handleContentTypeMismatch(error: unknown){
	if((error as { message: string })?.message){
		const message = (error as { message: string }).message;
		const errorMatch = [
			"Content-Type",
		];
		
		if(message.includes(errorMatch[0])){
			return Response.json({
				message: "Invalid Content-Type Header",
				error: message,
			}, {status: 415});
		}
	}
}

export function handleFieldValidation(error:  Readonly<ValidationError>){
	const errorData = handleTypeboxError(error);
	return Response.json({
		data: errorData,
		message: "Validation Error",
	}, {status:422} );
}