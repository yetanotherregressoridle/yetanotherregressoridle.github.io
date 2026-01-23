export function formatNumber(value: number | undefined): string {
    if (value === undefined || value === null) return "0.00";
    return value.toFixed(2);
}
