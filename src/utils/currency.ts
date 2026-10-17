export const formatPrice = (amount: number): string =>
  `PKR ${amount.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
