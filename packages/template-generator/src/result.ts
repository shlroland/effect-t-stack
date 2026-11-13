export type Result<A, E> =
  | { readonly _tag: "Success"; readonly value: A }
  | { readonly _tag: "Failure"; readonly error: E }

export const succeed = <A>(value: A): Result<A, never> => ({ _tag: "Success", value })

export const fail = <E>(error: E): Result<never, E> => ({ _tag: "Failure", error })
