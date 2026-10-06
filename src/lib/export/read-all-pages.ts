type Page<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

export async function readAllPages<T>(
  readPage: (from: number, to: number) => PromiseLike<Page<T>>,
  pageSize = 500,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await readPage(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data) throw new Error("A data page was unavailable.");
    rows.push(...data);
    if (data.length < pageSize) return rows;
  }
}
