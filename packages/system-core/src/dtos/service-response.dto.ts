export interface ServiceResponseDto<T> {
  success?: boolean
  granted?: boolean | number
  data?: T
  message?: any
  code?: string | number
  status?: number
}
