export const handleMessageError = (error: any): string => {
  if (typeof error === 'string') return error
  return (
    error?.data?.description ||
    error?.description ||
    error?.response?.data?.message ||
    error?.message ||
    JSON.stringify(error)
  )
}
