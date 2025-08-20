export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

export const formatPercentage = (value: number): string =>
  `${value.toFixed(1)}%`;
