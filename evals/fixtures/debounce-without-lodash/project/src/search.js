export function createSearchController({ search }) {
  return {
    input(value) {
      search(value);
    },
  };
}
