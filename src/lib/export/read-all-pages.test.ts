import { readAllPages } from "./read-all-pages";

describe("financial export pagination", () => {
  it("includes records after the first page", async () => {
    const source = ["one", "two", "three", "four", "five"];
    const result = await readAllPages(
      async (from, to) => ({ data: source.slice(from, to + 1), error: null }),
      2,
    );
    expect(result).toEqual(source);
  });

  it("does not return a partial export when a page fails", async () => {
    await expect(
      readAllPages(
        async (from) =>
          from === 0
            ? { data: ["one"], error: null }
            : { data: null, error: { message: "Database unavailable" } },
        1,
      ),
    ).rejects.toThrow("Database unavailable");
  });
});
