import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createUser, CreateUserRequest } from './api'

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateUserRequest) => createUser(data),
    onSuccess: () => {
      // Invalidate users list query if it existed (not yet created but good practice)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
