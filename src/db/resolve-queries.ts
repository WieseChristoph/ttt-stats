type ResolvedQueriesType<T extends Record<string, PromiseLike<unknown>>> = {
    [Key in keyof T]: Awaited<T[Key]>;
};

export async function resolveQueries<const T extends Record<string, PromiseLike<unknown>>>(
    queries: T,
): Promise<ResolvedQueriesType<T>> {
    const keys = Object.keys(queries) as Array<keyof T>;
    const values = await Promise.all(keys.map((key) => queries[key]));

    return Object.fromEntries(keys.map((key, index) => [key, values[index]])) as ResolvedQueriesType<T>;
}
