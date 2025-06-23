type ResponsePayload<T> = {
  status: string | number
  message: string
  data: T | null
}

const createResponse = <T>(
  status: string | number,
  message: string,
  data: T | null = null
): ResponsePayload<T> => {
  return {
    status,
    message,
    data
  }
}

export default createResponse