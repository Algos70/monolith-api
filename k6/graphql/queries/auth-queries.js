export const AUTH_QUERIES = {
  REGISTER: `
    mutation Register($input: RegisterInput!) {
      register(input: $input) {
        success
        message
      }
    }
  `,

  LOGIN: `
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        success
        message
        user {
          sub
          email
          preferred_username
          name
          given_name
          family_name
          email_verified
          permissions
          dbUserId
        }
      }
    }
  `,

  ME: `
    query Me {
      me {
        sub
        email
        preferred_username
        name
        given_name
        family_name
        email_verified
        permissions
        dbUserId
      }
    }
  `,

  LOGOUT: `
    mutation Logout {
      logout {
        success
        message
      }
    }
  `,


};