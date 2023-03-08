import { AnyAction, Dispatch, MiddlewareAPI } from "@reduxjs/toolkit";

type AppMiddleware<S, E extends AnyAction> =
    (api: Dispatch<E> extends Dispatch<AnyAction> ? MiddlewareAPI<Dispatch<E>, S> : never) =>
        (next: Dispatch<E>) =>
            (action: E) => ReturnType<Dispatch<E>>

export default AppMiddleware;