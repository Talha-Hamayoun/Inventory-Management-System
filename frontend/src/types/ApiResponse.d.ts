
type InputError = { path: PropertyKey[], message: string }

interface ResError {
    success: false;
    message: string;
    userErrors?: InputError[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ApiResponse<SuccessType, ErrorType = void> =
    ({ success: true } & SuccessType)
    | ResError;