export const isCoreWeb = () => {
  return typeof window.finSdk !== "undefined" && window.finSdk;
};

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export const parseData = (data: any) => {
  if (!data) return data;

  const _data =
    typeof data === "string" && (data.includes("{") || data.includes("["))
      ? data
      : JSON.stringify(data);

  return JSON.parse(
    //@ts-ignore
    _data.replaceAll('"true"', "true").replaceAll('"false"', "false"),
  );
};
