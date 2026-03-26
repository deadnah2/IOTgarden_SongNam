export function pickDefinedFields<T extends object>(
  input: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>).filter(
      ([_, value]) => value !== undefined,
    ),
  ) as Partial<T>;
}
